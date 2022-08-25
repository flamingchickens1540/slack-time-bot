import type { SlackActionMiddlewareArgs, BlockAction, ButtonAction, AllMiddlewareArgs } from "@slack/bolt"
import type { Block } from "@slack/web-api"
import { getAcceptedDm } from "."
import { saveData } from ".."
import { addHours } from "../utils//drive"




export async function handleAcceptButton({ ack, body, action, client }: SlackActionMiddlewareArgs<BlockAction<ButtonAction>> &AllMiddlewareArgs) {
    await ack()
    let request_id = action.value
    let time_request = timeRequests[request_id]

    await Promise.all(Object.entries(time_request.requestMessages).map(async ([approver_id, request_message]) => {
        try {
            let message = (await client.conversations.history({ channel: request_message.channel, latest: request_message.ts, limit: 1, inclusive: true })).messages![0]
            let oldBlocks = message.blocks!
            let footer_name = (body.user.id == approver_id) ? "You" : `<@${body.user.id}>`
            client.chat.update({
                channel: request_message.channel,
                ts: request_message.ts,
                text: message.text + " (ACCEPTED)",
                blocks: [
                    oldBlocks[0] as Block,
                    oldBlocks[1] as Block,
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `*_:white_check_mark: Approved by ${footer_name} :white_check_mark:_*`
                        }
                    },
                    { "type": "divider" }
                ]
            })
        } catch (err) { console.error("Failed to handle reject modal:\n" + err) }
    }))

    addHours(time_request.name, time_request.time)

    await client.chat.postMessage({ channel: time_request.userId, text: getAcceptedDm(body.user.id, time_request.time, time_request.activity) })
    delete timeRequests[request_id]
    saveData()
}


