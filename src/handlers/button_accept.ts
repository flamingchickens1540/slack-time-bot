import type { SlackActionMiddlewareArgs, BlockAction, ButtonAction } from "@slack/bolt"
import type { WebClient } from "@slack/web-api"
import { getAcceptedDm } from "."
import { savePendingRequests } from ".."
import { slack_approver_id } from "../consts"
import { addHours } from "../utils//drive"




export async function handleAcceptButton({ ack, body, action, client }: SlackActionMiddlewareArgs<BlockAction<ButtonAction>> & { client: WebClient }) {
    await ack()
    let request_id = action.value
    let time_request = timeRequests[request_id]

    let oldBlocks = body.message!.blocks
    try {
        client.chat.update({
            channel: body.channel!.id,
            ts: body.message!.ts,
            text: body.message!.text + " (ACCEPTED)",
            blocks: [oldBlocks[0], oldBlocks[1], footer,
            {
                "type": "divider"
            }]
        })
    } catch (err) { console.error("Failed to handle accept button:\n" + err)}

    addHours(time_request.name, time_request.time)

    await client.chat.postMessage({ channel: time_request.userId, text: getAcceptedDm(slack_approver_id, time_request.time, time_request.activity) })
    delete timeRequests[request_id]
    savePendingRequests()
}


const footer = {
    type: "section",
    text: {
        type: "mrkdwn",
        text: "*_:white_check_mark: ADDED :white_check_mark:_*"
    }
}