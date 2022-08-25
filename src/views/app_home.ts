import type { KnownBlock, MrkdwnElement, PlainTextElement, PlainTextOption, SectionBlock } from "@slack/bolt";
import type { LeaderboardType, LogRow } from "../types";
import { getHours } from "../utils/drive";
import { leaderboard_config } from "../consts";
type LeaderboardEntry = { name: string, hours: number }
type LeaderboardFilter = (value: LogRow, index: number, array: LogRow[]) => boolean

export async function getLeaderboardView(user: string): Promise<KnownBlock[]> {
    if (typeof (homeSettings[user]) === 'undefined') {
        homeSettings[user] = {
            leaderboard_type: 'total'
        }
    }
    
    let settings = homeSettings[user]
    
    // Get the leaderboard
    let hours = await getHours()
    let elegible_hours = hours.filter(leaderboardFilters[settings.leaderboard_type])
    let people: { [key: string]:LeaderboardEntry } = {}
    
    // Sum the hours for each person
    elegible_hours.forEach(row => {
        if (typeof (people[row.name]) === 'undefined') {
            people[row.name] = { name: row.name, hours: 0 }
        }
        people[row.name].hours += row.hours
    })
    
    // Sort the people by hours, reversed
    let sorted = Object.values(people).sort((a, b) => b.hours - a.hours).slice(0, 10)
    let leaderboard_data = sorted.map(({ name, hours }) => ({ name: name, hours: hours }))
    
    return getLeaderboardViewBlocks(leaderboard_data, settings.leaderboard_type)
}


const getLeaderboardViewBlocks = (leaderboard_entries: { name: string, hours: number }[], currentMetric: LeaderboardType, entryCount?: number): KnownBlock[] => {
    entryCount = entryCount ?? 10
    let fields: MrkdwnElement[] = []
    // Calculate padding amounts
    let name_padding = 0
    let time_padding = 0
    let max_hours = 0

    leaderboard_entries.forEach((entry, index) => {
        let name_length = entry.name.length+(index+1).toString().length+2
        if (name_length > name_padding) name_padding = name_length

        let time_length = entry.hours.toFixed(1).length+6
        if (time_length > time_padding) time_padding = time_length

        if (entry.hours > max_hours) max_hours = entry.hours
    })
    leaderboard_entries.forEach((entry, index) => {
        let name_text = `${index + 1}) ${entry.name}`.padEnd(name_padding)
        let hour_text = `${entry.hours.toFixed(1)} hours`.padEnd(time_padding)
        let bar_length = Math.round(entry.hours/max_hours*leaderboard_config.max_bar_length)
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
    let fieldGroups: SectionBlock[] = []
    for (let index = 0; index < fields.length; index += 10) {
        let chunk = fields.slice(index, index + 10);
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
                options: Object.values(metrics),
                action_id: "selected_metric"
            }
        },
        ...fieldGroups
    ]
};

const metrics: { [key: string]: PlainTextOption } = {
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
const getTotalHoursLeaderboard: LeaderboardFilter = (value) => { return true }
const getWeeklyHoursLeaderboard: LeaderboardFilter = (value) => {
    // Get date 7 days ago
    let date = new Date().getTime() - (7 * 24 * 60 * 60 * 1000)
    return value.time_out.getTime() > date
}
const getExternalHoursLeaderboard: LeaderboardFilter = (value) => { return value.type == 'external' }
const getLabHoursLeaderboard: LeaderboardFilter = (value) => { return value.type == 'lab' }

const leaderboardFilters: { [key: string]: LeaderboardFilter } = {
    'total': getTotalHoursLeaderboard,
    'weekly': getWeeklyHoursLeaderboard,
    'external': getExternalHoursLeaderboard,
    'lab': getLabHoursLeaderboard
}