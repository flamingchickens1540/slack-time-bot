import { App } from "@slack/bolt";


import "cron";
import { CronJob } from "cron";
import { v4 as uuidV4 } from "uuid";
import { app_token, signing_secret, token } from '../secrets/slack_secrets.js';
import { register_listeners } from "./handlers/index.js";
import { getAllPendingRequestBlocks, getSubmittedAltText } from "./messages.js";
import { TimeRequest } from "./types";
import type { HomeSettings } from './types.js';
import { loadData, saveData } from "./utils/data.js";
import { getRequestBlocks } from "./views/new_request.js";

// Initialize global data
declare global {
    var timeRequests: { [key: string]: TimeRequest };
    var homeSettings: { [key: string]: HomeSettings };
    var slackApproverIDs: string[];
}

loadData()


// Initialize Slack App
const slack_app = new App({
    token: token,
    signingSecret: signing_secret,
    socketMode: true,
    appToken: app_token,
});

register_listeners(slack_app)

slack_app.start().then(async () => {
    console.log("Bot started")
})


// Schedule Tasks

const sendPendingPing = async () => {
    var pendingRequests = Object.values(timeRequests)
    slackApproverIDs.forEach(async (approver_id) => {
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
    let user_info = await slack_app.client.users.info({user: uid});
    let name = user_info.user!.real_name!
    
    // Create new request object
    let request_id = uuidV4()
    timeRequests[request_id] = {
        name: name,
        time: hrs,
        userId: uid,
        activity: activity,
        requestMessages: {}
    }

    // Send request message to approvers
    let blocks = getRequestBlocks(uid, hrs, activity, request_id)

    await Promise.all(slackApproverIDs.map(async (approver_id) => {
        let message = await slack_app.client.chat.postMessage({ channel: approver_id, text: getSubmittedAltText(name, hrs, activity), blocks: blocks })
        timeRequests[request_id].requestMessages[approver_id] = {
            channel: message.channel!,
            ts: message.ts!
        }
    }))
    saveData()
}

