import type { ModalView } from "@slack/bolt";
import { formatDuration, sanitizeCodeblock } from "../messages";

export function getRespondMessageModal(type: "Accept"|"Reject", name:string, hours:number, activity:string, request_id:string): ModalView {
    const callback_id = `${type.toLowerCase()}_modal`
    return {
        type: "modal",
        private_metadata: request_id,
        callback_id: callback_id,
        title: {
            type: "plain_text",
            text: type+"Time Request",
            emoji: true
        },
        submit: {
            type: "plain_text",
            text: type+" and Send",
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
                    text: type+" and Send Message",
                    emoji: true
                }
            }
        ]
    }
}
