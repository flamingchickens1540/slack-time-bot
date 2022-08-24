import { App, SlackCommandMiddlewareArgs, SlackShortcutMiddlewareArgs, View } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { handleHoursRequest } from "..";
import { getSubmittedDm } from ".";
import log_modal from "../views/log_view";
import { tooFewHours } from "../messages";


function parseTimeArg(arg:string, hours:number, actIndex:number): [number, number] {
    if (!isNaN(parseInt(arg.slice(0, arg.length - 1))) &&arg.length != 1) {
        let val = parseFloat(arg)
        if (arg.slice(-1) === 'h') {
            hours += val;
        } else if (arg.slice(-1) === 'm') {
            hours += val/60;
        }
        actIndex += 1;
    }
    return [hours, actIndex]
}
export async function handleLogcommand({ command, ack, respond, client}: SlackCommandMiddlewareArgs & {client: WebClient}) {
    await ack()

    var hours = 0, actStart = 0;
    let args = command.text.split(" ")
    if (args.length === 0 || args[0] === '') {
        await client.views.open({
            view: log_modal,
            trigger_id: command.trigger_id
        })
    } else if (args.length === 1) {

    } else {
        [hours, actStart] = parseTimeArg(args[0], hours, actStart);
        [hours, actStart] = parseTimeArg(args[1], hours, actStart);

        let activity = args.slice(actStart, args.length).join(' ');
        let msg_txt = getSubmittedDm({hours:hours, activity:activity});
        try {
            if (hours == 0) {
                await respond({ response_type: 'ephemeral', text: tooFewHours})
            } else {
                await client.chat.postMessage({ channel: command.user_id, text: msg_txt })
            }
        } catch (err) { console.error("Failed to confirm log command:\n" + err) }

        if (hours > 0) {
            handleHoursRequest(command.user_id, hours, activity)
        }

    }
}

export async function handleLogShortcut({ shortcut, ack, client}: SlackShortcutMiddlewareArgs & {client: WebClient}) {
    await ack()

    await client.views.open({
        view: log_modal,
        trigger_id: shortcut.trigger_id
    })
}