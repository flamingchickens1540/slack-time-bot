import type { Block, HomeView, KnownBlock, MrkdwnElement, PlainTextOption } from "@slack/bolt";
import type { WebClient } from "@slack/web-api";
import type { LeaderboardType, LogRow } from "../consts";
import { formatDuration } from "../handlers";
import { getHours } from "../utils/drive";

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
    let people: { [key: string]:any } = {}
    
    // Sum the hours for each person
    elegible_hours.forEach(row => {
        if (typeof (people[row.name]) === 'undefined') {
            people[row.name] = { name: row.name, hours: 0 }
        }
        people[row.name].hours += row.hours
    })
    
    // Sort the people by hours, reversed
    let sorted = Object.values(people).sort((a, b) => b.hours - a.hours).slice(0, 10)
    let leaderboard_data = sorted.map(({ name, hours }) => ({ name: name, hours: hours.toFixed(1) }))
    
    return getLeaderboardViewBlocks(leaderboard_data, settings.leaderboard_type)
}


const getLeaderboardViewBlocks = (leaderboard_entries: { name: string, hours: string }[], currentMetric: LeaderboardType, entryCount?: number): KnownBlock[] => {
    entryCount = entryCount ?? 10
    let fields: MrkdwnElement[] = []
    leaderboard_entries.forEach((entry, index) => {
        fields.push({
            type: "mrkdwn",
            text: `*${index + 1})* ${entry.name}`,
        },
        {
            type: "mrkdwn",
            text: `*${formatDuration(parseFloat(entry.hours))}*`,
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
    let fieldGroups: KnownBlock[] = []
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



