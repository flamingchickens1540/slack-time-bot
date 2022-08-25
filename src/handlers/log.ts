import type { AllMiddlewareArgs, SlackCommandMiddlewareArgs, SlackShortcutMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from "@slack/bolt";
import type { WebClient } from "@slack/web-api";
import { handleHoursRequest } from "..";
import { formatDuration, noActivitySpecified, sanitizeCodeblock, tooFewHours } from "../messages";
import log_modal from "../views/log";


function parseTimeArg(arg: string, hours: number, actIndex: number): [number, number] {
    if (!isNaN(parseInt(arg.slice(0, arg.length - 1))) && arg.length != 1) {
        let val = parseFloat(arg)
        if (arg.slice(-1) === 'h') {
            hours += val;
        } else if (arg.slice(-1) === 'm') {
            hours += val / 60;
        }
        actIndex += 1;
    }
    return [hours, actIndex]
}

export async function handleLogCommand({ command, ack, respond, client }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
    await ack()

    var hours = 0, actStart = 0;
    let args = command.text.split(" ")
    if (args.length === 0 || args[0] === '') {
        await client.views.open({
            view: log_modal,
            trigger_id: command.trigger_id
        })
    } else if (args.length === 1) {
        await respond({ response_type: 'ephemeral', text: noActivitySpecified })
    } else {
        [hours, actStart] = parseTimeArg(args[0], hours, actStart);
        [hours, actStart] = parseTimeArg(args[1], hours, actStart);

        let activity = args.slice(actStart, args.length).join(' ');
        if (activity == '') {
            await respond({ response_type: 'ephemeral', text: noActivitySpecified })
            return
        }
        let msg_txt = getSubmittedDm({ hours: hours, activity: activity });
        try {
            if (hours <= 0) {
                await respond({ response_type: 'ephemeral', text: tooFewHours })
            } else {
                await client.chat.postMessage({ channel: command.user_id, text: msg_txt })
                handleHoursRequest(command.user_id, hours, activity)
            }
        } catch (err) { console.error("Failed to complete log command:\n" + err) }

    }
}

export async function handleLogShortcut({ shortcut, ack, client }: SlackShortcutMiddlewareArgs & { client: WebClient }) {
    await ack()

    await client.views.open({
        view: log_modal,
        trigger_id: shortcut.trigger_id
    })
}

export async function handleLogModal({ ack, body, view, client }: SlackViewMiddlewareArgs<ViewSubmitAction> & { client: WebClient }) {
    await ack()

    // Get the hours and task from the modal
    let hours = parseFloat(view.state.values.hours.hours.value ?? "0");
    let activity = view.state.values.task.task.value ?? "Unknown";

    // Ensure the time values are valid
    hours = isNaN(hours) ? 0 : hours;

    if (hours > 0) {
        let message = getSubmittedDm({ hours: hours, activity: activity });
        try {
            await client.chat.postMessage({ channel: body.user.id, text: message })
        } catch (err) { console.error("Failed to handle log modal:\n" + err) }
        handleHoursRequest(body.user.id, hours, activity)
    } else {
        await client.chat.postMessage({ channel: body.user.id, text: tooFewHours })
    }
}

export const getSubmittedDm = (data: { hours: number, minutes?: number, activity: string }) => {
    return `:clock2: You submitted *${formatDuration(data.hours, data.minutes)}* :clock7:\n>>>:person_climbing: *Activity:*\n\`${sanitizeCodeblock(data.activity)}\``
}