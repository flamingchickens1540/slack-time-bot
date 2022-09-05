import { App } from "@slack/bolt";
import { CronJob } from "cron";
import * as uuid from "uuid";
import { app_token, signing_secret, token } from '../secrets/slack_secrets';
import { register_listeners } from "./handlers/index";
import { getAllPendingRequestBlocks, getSubmittedAltText } from "./messages";
import { ensureSettingsExist, loadData, saveData, data } from "./utils/data";
import { getRequestBlocks } from "./views/new_request";

// Initialize global data



loadData()


// Initialize Slack App
const slack_app = new App({
    token: token,
    signingSecret: signing_secret,
    socketMode: true,
    appToken: app_token,
});

export const slack_client = slack_app.client;

register_listeners(slack_app)

slack_app.start().then(async () => {
    console.log("Bot started")

    const users = await slack_client.users.list()
    users.members?.forEach(async (member) => {
        if (!member.is_bot) {
            await ensureSettingsExist(member.id)
        }
    })
})


// Schedule Tasks

const sendPendingPing = async () => {
    const pendingRequests = Object.values(data.timeRequests)
    if (pendingRequests.length == 0) return
    data.slackApproverIDs.forEach(async (approver_id) => {
        slack_app.client.chat.postMessage({
            channel: approver_id,
            text: `${pendingRequests.length} pending time requests`,
            blocks: await getAllPendingRequestBlocks(slack_app.client)
        })
    })
}
// Send list of pending requests at 9:30am on weekdays
new CronJob('30 9 * * 1-5', sendPendingPing, null, true, 'America/Los_Angeles').start()
console.log("Cron Job Scheduled!")


export async function handleHoursRequest(uid: string, hrs: number, activity: string) {
    const user_info = await slack_app.client.users.info({ user: uid });
    const name = user_info.user!.real_name!

    // Create new request object
    const request_id = uuid.v4()
    data.timeRequests[request_id] = {
        name: name,
        time: hrs,
        userId: uid,
        activity: activity,
        requestMessages: {}
    }

    // Send request message to approvers
    const blocks = getRequestBlocks(uid, hrs, activity, request_id)

    await Promise.all(data.slackApproverIDs.map(async (approver_id) => {
        const message = await slack_app.client.chat.postMessage({ channel: approver_id, text: getSubmittedAltText(name, hrs, activity), blocks: blocks })
        data.timeRequests[request_id].requestMessages[approver_id] = {
            channel: message.channel!,
            ts: message.ts!
        }
    }))
    saveData()
}
