import type { AllMiddlewareArgs, KnownBlock, SlackViewMiddlewareArgs, ViewSubmitAction } from "@slack/bolt";
import type { ButtonActionMiddlewareArgs } from "../types";
import { formatDuration, sanitizeCodeblock } from "../messages";
import { saveData, data } from "../utils/data";
import { getRejectMessageModal } from "../views/reject";




export async function handleRejectButton({ ack, body, action, client, logger }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    const requestInfo = data.timeRequests[action.value]
    try {
        client.views.open({
            trigger_id: body.trigger_id,
            view: getRejectMessageModal(requestInfo.name, requestInfo.time, requestInfo.activity, action.value)
        })
    } catch (err) { logger.error("Failed to handle reject button:\n" + err) }

}


export async function handleRejectModal({ ack, body, view, client, logger }: SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
    await ack()
    const request_id = view.private_metadata
    const timeRequest = data.timeRequests[request_id]
    await Promise.all(Object.entries(timeRequest.requestMessages).map(async ([approver_id, request_message]) => {
        try {
            const message = (await client.conversations.history({ channel: request_message.channel, latest: request_message.ts, limit: 1, inclusive: true })).messages![0]
            const oldBlocks = message.blocks! as KnownBlock[]
            const footer_name = (body.user.id == approver_id) ? "You" : `<@${body.user.id}>`

            client.chat.update({
                channel: request_message.channel,
                ts: request_message.ts,
                text: message.text + " (REJECTED)",
                blocks: [
                    oldBlocks[0],
                    oldBlocks[1],
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
        } catch (err) { logger.error("Failed to handle reject modal:\n" + err) }
    }))


    try {
        client.chat.postMessage({
            channel: timeRequest.userId,
            text: getRejectedDm(body.user.id, timeRequest.time, timeRequest.activity, body.view.state.values.message.input.value)
        })
    } catch (err) { logger.error("Failed to handle reject modal:\n" + err) }

    delete data.timeRequests[request_id]
    saveData()
}

const getRejectedDm = (user, hours, activity, message) => {
    return `:x: *<@${user}>* rejected *${formatDuration(hours)}* :x:\n>>>:person_climbing: *Activity:*\n\`${sanitizeCodeblock(activity)}\`\n:loudspeaker: *Message:*\n\`${sanitizeCodeblock(message)}\``
}