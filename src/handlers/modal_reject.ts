import type { SlackViewMiddlewareArgs, ViewSubmitAction } from "@slack/bolt";
import type { WebClient } from "@slack/web-api";
import { getRejectedDm } from ".";
import { saveData } from "..";
import { slack_approver_id } from "../consts";

export async function handleRejectModal({ ack, body, view, client }: SlackViewMiddlewareArgs<ViewSubmitAction> & { client: WebClient }) {
    await ack()
    let request_id = view.private_metadata
    let timeRequest = timeRequests[request_id]

    if (timeRequest.requestMessage != null) {
        try {
            let oldBlocks = timeRequest.requestMessage!.blocks
            client.chat.update({
                channel: timeRequest.requestMessage.channel,
                ts: timeRequest.requestMessage.ts,
                text: timeRequest.requestMessage.text + " (REJECTED)",
                blocks: [
                    oldBlocks[0],
                    oldBlocks[1],
                    footer,
                    { "type": "divider" }
                ]
            })
        } catch (err) { console.error("Failed to handle reject modal:\n" + err) }
    }

    try {
        client.chat.postMessage({
            channel: body.user.id,
            text: getRejectedDm(slack_approver_id, timeRequest.time, timeRequest.activity, body.view.state.values.message.input.value)
        })
    } catch (err) { console.error("Failed to handle reject modal:\n" + err) }

    delete globalThis.timeRequests[request_id]
    saveData()
}


const footer = {
    type: "section",
    text: {
        type: "mrkdwn",
        text: "*_:x: REJECTED :x:_*"
    }
}
