import type { Block, HomeView, MrkdwnElement, PlainTextOption } from "@slack/bolt";
import { LeaderboardType } from "../consts";
import { formatDuration } from "../handlers";




export const getLeaderboardView = (leaderboard_entries: { name: string, hours: string }[], currentMetric: LeaderboardType, entryCount?:number): HomeView => {
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
    let fieldGroups:{ type: string; fields: MrkdwnElement[]; }[] = []
    for (let index = 0; index < fields.length; index += 10) {
        let chunk = fields.slice(index, index+10);
        fieldGroups.push({
            type: "section",
            fields: chunk
        })
    }
    return {
        type: "home",
        callback_id: "leaderboard_view",
        blocks: [
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
    }
};

const metrics:{[key:string]:PlainTextOption} = {
    total: {
        text: {
            type: "plain_text",
            text: "Total Hours",
            emoji: true
        },
        value: "total"
    },
    weekly:{
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