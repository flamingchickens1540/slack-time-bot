import type { ModalView } from "@slack/bolt";
import { formatDuration, sanitizeCodeblock } from "../messages";

export function getRejectMessageModal(name:string, hours:number, activity:string, request_id:string): ModalView {
    return {
        type: "modal",
        private_metadata: request_id,
        callback_id: "reject_message",
        title: {
            type: "plain_text",
            text: "Reject Time Request",
            emoji: true
        },
        submit: {
            type: "plain_text",
            text: "Reject and Send",
            emoji: true
        },
        close: {
            type: "plain_text",
            text: "Cancel",
            emoji: true
        },
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `_*${name}*_ submitted *${formatDuration(hours)}* for activity\n\n>_\`\`\`${sanitizeCodeblock(activity)}\`\`\`_`
                }
            },
            {
                type: "divider"
            },
            {
                type: "input",
                block_id: "message",
                element: {
                    type: "plain_text_input",
                    multiline: true,
                    action_id: "input"
                },
                label: {
                    type: "plain_text",
                    text: "Reject and Send Message",
                    emoji: true
                }
            }
        ]
    }
}
