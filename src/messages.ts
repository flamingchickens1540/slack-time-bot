import { KnownBlock, WebClient } from "@slack/web-api"
import { TimeRequest } from "./consts"
import { formatDuration, sanitizeCodeblock } from "./handlers"

/** 
* Push notification message for when a time request is submitted
*/
export const getSubmittedAltText = (name: string, hours: number, activity: string) => {
    return `${name} submitted ${formatDuration(hours)} for ${activity}`
}

/**
 * Message for when a time request for 0 hours is submitted
 */
export const tooFewHours = ":warning: I just blocked your submission of ZERO hours. Please submit hours in the form: `/log 2h 15m write error messaging for the slack time bot #METAAAAA!!!` :warning: (Make note of spaces/lack of spaces)"

/**
 * Gets a list of pending time requests
*/
export const getPendingRequestBlocks = async (countList:TimeRequest[], slack_client:WebClient) => {

    let output:KnownBlock[] = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": ":clock1: Pending Time Requests:",
                "emoji": true
            }
        },
    ]
    await Promise.all(countList.map(async (person) => {
        let permalink = await slack_client.chat.getPermalink({ channel: person.requestMessage.channel, message_ts: person.requestMessage.ts })
        output.push({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*${person.name}* - ${formatDuration(person.time)}\n\`${sanitizeCodeblock(person.activity)}\``,
            },
            "accessory": {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Jump"
                },
                "url": permalink.permalink,
                "action_id": "jump_url"
            }
        }, {"type": "divider"})
    }));
    return output
}