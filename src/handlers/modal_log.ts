import type { SlackViewMiddlewareArgs, ViewSubmitAction } from "@slack/bolt";
import type { WebClient } from "@slack/web-api";
import { getSubmittedDm } from ".";
import { handleHoursRequest } from "..";
import { tooFewHours } from "../messages";

export async function handleLogModal({ack, body, view, client}:SlackViewMiddlewareArgs<ViewSubmitAction> & {client: WebClient}) {
    await ack()

    // Get the hours and task from the modal
    let hours = parseFloat(view.state.values.hours.hours.value ?? "0");
    let activity = view.state.values.task.task.value ?? "Unknown";
    
    // Ensure the time values are valid
    hours = isNaN(hours) ? 0 : hours;

    if (hours > 0) {
        let message = getSubmittedDm({hours: hours, activity: activity});
        try {
            await client.chat.postMessage({ channel: body.user.id, text: message })
        } catch (err) { console.error("Failed to handle log modal:\n" + err) }
        handleHoursRequest(body.user.id, hours, activity)
    } else {
        await client.chat.postMessage({ channel: body.user.id, text: tooFewHours })
    }
}