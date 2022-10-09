import type { AllMiddlewareArgs, BlockAction, KnownBlock, SlackViewMiddlewareArgs, ViewSubmitAction } from "@slack/bolt"
import { WebClient } from "@slack/web-api"
import { formatDuration, sanitizeCodeblock } from "../messages"
import { ButtonActionMiddlewareArgs, TimeRequest } from "../types"
import { data, saveData } from "../utils/data"
import { addHours } from "../utils/drive"
import { getRespondMessageModal } from "../views/respond"

export async function handleAcceptMessageButton({ ack, body, action, client, logger }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    const requestInfo = data.timeRequests[action.value]
    try {
        client.views.open({
            trigger_id: body.trigger_id,
            view: getRespondMessageModal("Accept", requestInfo.name, requestInfo.time, requestInfo.activity, action.value)
        })
    } catch (err) { logger.error("Failed to handle accept button:\n" + err) }
}

export async function handleAcceptModal({ ack, body, view, client }: SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
    await ack()
    
    const request_id = view.private_metadata
    const time_request = data.timeRequests[request_id]
    
    await client.chat.postMessage({ channel: time_request.userId, text: getAcceptedDm(body.user.id, time_request.time, time_request.activity, body.view.state.values.message.input.value) })
    await handleAccept(time_request, body, client)

    delete data.timeRequests[request_id]
    saveData()
}

export async function handleAcceptButton({ ack, body, action, client }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    
    const request_id = action.value
    const time_request = data.timeRequests[request_id]
    
    await client.chat.postMessage({ channel: time_request.userId, text: getAcceptedDm(body.user.id, time_request.time, time_request.activity) })
    await handleAccept(time_request, body, client)

    delete data.timeRequests[request_id]
    saveData()
}

async function handleAccept(time_request:TimeRequest, body:BlockAction|ViewSubmitAction, client:WebClient) {
    
    try {
        await addHours(time_request.name, time_request.time, time_request.activity)
    } catch {
        console.error("Failed to add hours with request", time_request)
        return
    }
    await Promise.all(Object.entries(time_request.requestMessages).map(async ([approver_id, request_message]) => {
        try {
            const message = (await client.conversations.history({ channel: request_message.channel, latest: request_message.ts, limit: 1, inclusive: true })).messages![0]
            const oldBlocks = message.blocks! as KnownBlock[]
            const footer_name = (body.user.id == approver_id) ? "You" : `<@${body.user.id}>`
            client.chat.update({
                channel: request_message.channel,
                ts: request_message.ts,
                text: message.text + " (ACCEPTED)",
                blocks: [
                    oldBlocks[0],
                    oldBlocks[1],
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `*_:white_check_mark: Accepted by ${footer_name} :white_check_mark:_*`
                        }
                    },
                    { "type": "divider" }
                ]
            })
        } catch (err) { console.error("Failed to handle accept modal:\n" + err) }
    }))
    
}

const getAcceptedDm = (user:string, hours:number, activity:string, message:string|null = null) => {
    if (message != null) {
        return `:white_check_mark: *<@${user}>* accepted *${formatDuration(hours)}* :white_check_mark:\n>>>:person_climbing: *Activity:*\n\`${sanitizeCodeblock(activity)}\`\n:loudspeaker: *Message:*\n\`${sanitizeCodeblock(message)}\``
    }
	return `:white_check_mark: *<@${user}>* accepted *${formatDuration(hours)}* :white_check_mark:\n>>>:person_climbing: *Activity:*\n\`${sanitizeCodeblock(activity)}\``
}

