import type { KnownBlock, MrkdwnElement, PlainTextOption, SectionBlock } from "@slack/bolt";
import type { LeaderboardType, LogRow, UserSettings } from "../types";
import { getHours } from "../utils/drive";
import { leaderboard_config } from "../consts";
import { getSettings, data } from "../utils/data";
import { departmentTitles } from "./settings";

type LeaderboardEntry = { name: string, hours: number }
type LeaderboardFilter = (value: LogRow, index: number, array: LogRow[]) => boolean

export async function getLeaderboardView(user: string): Promise<KnownBlock[]> {

    const settings = getSettings(user)
    
    // Get the leaderboard
    const hours = await getHours()
    
    let leaderboard_candidates:LeaderboardEntry[]
    switch (settings.leaderboard_type) {
        case "department":
            leaderboard_candidates = getDepartmentHours(hours)
            break;
        default:
            leaderboard_candidates = getCandidatesFromFilter(hours, leaderboardFilters[settings.leaderboard_type])
            break;
    }
    
    
    // Sort the people by hours, reversed
    const leaderboard_data = leaderboard_candidates.sort((a, b) => b.hours - a.hours).slice(0, 10)
    return getLeaderboardViewBlocks(leaderboard_data, settings.leaderboard_type)
}


const getLeaderboardViewBlocks = (leaderboard_entries: { name: string, hours: number }[], currentMetric: LeaderboardType): KnownBlock[] => {
    const fields: MrkdwnElement[] = []
    // Calculate padding amounts
    let name_padding = 0
    let time_padding = 0
    let max_hours = 0

    leaderboard_entries.forEach((entry, index) => {
        const name_length = entry.name.length+(index+1).toString().length+2
        if (name_length > name_padding) name_padding = name_length

        const time_length = entry.hours.toFixed(1).length+6
        if (time_length > time_padding) time_padding = time_length

        if (entry.hours > max_hours) max_hours = entry.hours
    })
    leaderboard_entries.forEach((entry, index) => {
        const name_text = `${index + 1}) ${entry.name}`.padEnd(name_padding)
        const hour_text = `${entry.hours.toFixed(1)} hours`.padEnd(time_padding)
        const bar_length = Math.round(entry.hours/max_hours*leaderboard_config.max_bar_length)
        let bar = ""
        bar += ":large_red_square:".repeat(Math.min(bar_length, leaderboard_config.max_r))
        bar += ":large_orange_square:".repeat(Math.max(Math.min(bar_length-leaderboard_config.max_r, leaderboard_config.max_o),0))
        bar += ":large_yellow_square:".repeat(Math.max(Math.min(bar_length-leaderboard_config.max_r-leaderboard_config.max_o, leaderboard_config.max_y),0))
        
        fields.push({
            type: "mrkdwn",
            text: `\`${name_text} -- ${hour_text}\``,
        },
        {
            type: "mrkdwn",
            text: " "+bar,
        }
        )
    })
    // Slack will error if the fields array is empty
    if (fields.length == 0) {
        fields.push({
            type: "mrkdwn",
            text: "No entries found",
        })
    }
    const fieldGroups: SectionBlock[] = []
    for (let index = 0; index < fields.length; index += 10) {
        const chunk = fields.slice(index, index + 10);
        fieldGroups.push({
            type: "section",
            fields: chunk
        })
    }
    
    return [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "Hours Leaderboard",
                emoji: true
            },
        },
        {
            block_id: "metric_selector",
            type: "section",
            fields: [{
                type: "plain_text",
                text: " ",
                emoji: true
            }],
            accessory: {
                type: "static_select",
                placeholder: {
                    type: "plain_text",
                    text: "Select an item",
                    emoji: true
                },
                initial_option: metrics[currentMetric],
                // options: Object.values(metrics),
                options: [metrics.department],
                action_id: "selected_metric"
            }
        },
        ...fieldGroups
    ]
};

const metrics: { [key in LeaderboardType]: PlainTextOption } = {
    department: {
        text: {
            type: "plain_text",
            text: "Department",
            emoji: true
        },
        value: "department"
    },
    total: {
        text: {
            type: "plain_text",
            text: "Total Hours",
            emoji: true
        },
        value: "total"
    },
    weekly: {
        text: {
            type: "plain_text",
            text: "Total Hours this Week",
            emoji: true
        },
        value: "weekly"
    },
    lab: {
        text: {
            type: "plain_text",
            text: "Total Lab Hours",
            emoji: true
        },
        value: "lab"
    },
    external: {
        text: {
            type: "plain_text",
            text: "Total External Hours",
            emoji: true
        },
        value: "external"
    }
}

function getCandidatesFromFilter(hours:LogRow[], filter:LeaderboardFilter):LeaderboardEntry[] {
    const elegible_hours = hours.filter(filter)
    const people: { [key: string]:LeaderboardEntry } = {}
    
    // Sum the hours for each person
    elegible_hours.forEach(row => {
        if (typeof (people[row.name]) === 'undefined') {
            people[row.name] = { name: row.name, hours: 0 }
        }
        people[row.name].hours += row.hours
    })
    return Object.values(people)
}

function getDepartmentHours(hours:LogRow[]):LeaderboardEntry[] {
    const departments: { [key: string]:{members:{[key:string]:boolean}, hours:number} } = {}
    const userCache:{[key:string]:string}= {}
    hours.forEach(row => {
        let user_id:string
        let settings:UserSettings
        if (row.name in userCache) {
            user_id = userCache[row.name]
            settings = getSettings(user_id)
        } else {
            // Find the user's settings
            const results = Object.entries(data.userSettings).find(([, value]) => value.real_name == row.name)
            if (results == null) {
                return
            }
            settings = results[1]
            userCache[row.name] = results[0]
        }
        if (typeof(settings.department) === 'undefined') {
            return
        }
        if (typeof (departments[settings.department]) === 'undefined') {
            departments[settings.department] = { members: {}, hours: 0 }
        }
        departments[settings.department].hours += row.hours
        departments[settings.department].members[row.name] = true
    })
    return Object.entries(departments).map(([name, data]) => {
        return { name: departmentTitles[name], hours: data.hours }
    })
}

const getTotalHoursLeaderboard: LeaderboardFilter = () => true
const getWeeklyHoursLeaderboard: LeaderboardFilter = (value) => {
    // Get date 7 days ago
    const date = new Date().getTime() - (7 * 24 * 60 * 60 * 1000)
    return value.time_out.getTime() > date
}
const getExternalHoursLeaderboard: LeaderboardFilter = (value) => { return value.type == 'external' }
const getLabHoursLeaderboard: LeaderboardFilter = (value) => { return value.type == 'lab' }

const leaderboardFilters: { [key:string]: LeaderboardFilter } = {
    'total': getTotalHoursLeaderboard,
    'weekly': getWeeklyHoursLeaderboard,
    'external': getExternalHoursLeaderboard,
    'lab': getLabHoursLeaderboard
}