import { App } from "@slack/bolt";
import { CronJob } from "cron";
import * as uuid from "uuid";
import { app_token, signing_secret, token } from '../secrets/slack_secrets';
import { register_listeners } from "./handlers/index";
import { getAllPendingRequestBlocks, getSubmittedAltText } from "./messages";
import { celebrateMembers } from "./tasks/certs";
import {  loadData, saveData, data, updateUsernames } from "./utils/data";
import { updateSlackMembers } from "./utils/drive";
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
new CronJob('30 9 * * 1-5', sendPendingPing, null, false, 'America/Los_Angeles').start()
new CronJob('*/5 * * * *', () => celebrateMembers(slack_app.client), null, false, 'America/Los_Angeles').start()
new CronJob('0 * * * *', updateUsernames, null, false, 'America/Los_Angeles', null, true).start()
new CronJob('*/15 * * * *', () => updateSlackMembers(slack_app.client), null, false, 'America/Los_Angeles', null, true).start()
celebrateMembers(slack_app.client)
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
        try {
            const message = await slack_app.client.chat.postMessage({ channel: approver_id, text: getSubmittedAltText(name, hrs, activity), blocks: blocks })
            data.timeRequests[request_id].requestMessages[approver_id] = {
                channel: message.channel!,
                ts: message.ts!
            }
        } catch (e) {
            console.error(e)
        }
    }))
    if (Object.values(data.timeRequests[request_id].requestMessages).length == 0) {
        await slack_app.client.chat.postMessage({ channel: uid, text: "Your request could not be submitted, please contact your local application software manager for help" })
    }
    saveData()
}
