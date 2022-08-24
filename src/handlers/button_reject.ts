import { WebClient } from "@slack/web-api";
import { ButtonActionMiddlewareArgs } from "../consts";
import { getRejectMessageModal } from "../views/reject_message_view";

export async function handleRejectButton({ ack, body, action, client }: ButtonActionMiddlewareArgs & { client: WebClient }) {
    await ack()
    let requestInfo = timeRequests[action.value]
    try {
        client.views.open({
            trigger_id: body.trigger_id,
            view: getRejectMessageModal(requestInfo.name, requestInfo.time, requestInfo.activity, action.value)
        })
    } catch (err) { console.error("Failed to handle reject button:\n" + err) }
    
}


