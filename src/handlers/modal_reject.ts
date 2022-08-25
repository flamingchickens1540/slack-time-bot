import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from "@slack/bolt";
import type { Block, WebClient } from "@slack/web-api";
import { getRejectedDm } from ".";
import { saveData } from "..";

export async function handleRejectModal({ ack, body, view, client }: SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
    await ack()
    let request_id = view.private_metadata
    let timeRequest = timeRequests[request_id]
    await Promise.all(Object.entries(timeRequest.requestMessages).map(async ([approver_id, request_message]) => {
        try {
            let message = (await client.conversations.history({ channel: request_message.channel, latest: request_message.ts, limit: 1, inclusive: true })).messages![0]
            let oldBlocks = message.blocks!
            let footer_name = (body.user.id == approver_id) ? "You" : `<@${body.user.id}>`
    
            client.chat.update({
                channel: request_message.channel,
                ts: request_message.ts,
                text: message.text + " (REJECTED)",
                blocks: [
                    oldBlocks[0] as Block,
                    oldBlocks[1] as Block,
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `*_:x: Rejected by ${footer_name}:x:_*`
                        }
                    },
                    { "type": "divider" }
                ]
            })
        } catch (err) { console.error("Failed to handle reject modal:\n" + err) }
    }))


    try {
        client.chat.postMessage({
            channel: timeRequest.userId,
            text: getRejectedDm(body.user.id, timeRequest.time, timeRequest.activity, body.view.state.values.message.input.value)
        })
    } catch (err) { console.error("Failed to handle reject modal:\n" + err) }

    delete globalThis.timeRequests[request_id]
    saveData()
}



