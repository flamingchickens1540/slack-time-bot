import { KnownBlock } from "@slack/bolt";
import { formatDuration, sanitizeCodeblock } from "../handlers";

export function getPendingRequestBlocks(uid: string, hrs: number, activity: string, request_id: string): KnownBlock[] {
    return [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "Time Submission",
                emoji: true
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `>>>*<@${uid}>* submitted *${formatDuration(hrs)}* for activity\n\`${sanitizeCodeblock(activity)}\``
            }
        },
        {
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        emoji: true,
                        text: "Add to Sheet"
                    },
                    style: "primary",
                    action_id: "accept",
                    value: request_id
                },
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        emoji: true,
                        text: "Reject w/ Message"
                    },
                    style: "danger",
                    action_id: "reject",
                    value: request_id
                }
            ]
        },
        {
            type: "divider"
        }
    ]
}