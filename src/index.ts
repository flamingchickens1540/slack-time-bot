import { App, LogLevel } from "@slack/bolt";

import { existsSync, readFileSync, writeFile } from 'fs';
import { app_token, signing_secret, token } from '../secrets/slack_secrets.js';
import { json_data_path, slack_approver_id } from './consts.js';
import type { HomeSettings, TimeRequest } from './consts.js';

import "cron";
import { v4 as uuidV4} from "uuid";
import { CronJob } from "cron";
import { handleLogCommand, handleLogShortcut } from "./handlers/command_log.js";
import { handleAcceptButton } from "./handlers/button_accept.js";
import { handleRejectButton } from "./handlers/button_reject.js";
import { handleLogModal } from "./handlers/modal_log.js";
import { handleRejectModal } from "./handlers/modal_reject.js";
import { getRequestBlocks } from "./views/new_request.js";
import { getSubmittedAltText, getAllPendingRequestBlocks } from "./messages.js";
import { handleGraphCommand } from "./handlers/command_graph.js";
import { handleAppHomeOpened, handleLeaderboardAction, publishHomeView } from "./handlers/app_home.js";
import { waitForGoogleDrive } from "./utils/drive.js";



declare global {
    var timeRequests: { [key: string]: TimeRequest };
    var homeSettings: { [key: string]: HomeSettings };
}
export async function saveData() {
    writeFile(json_data_path, JSON.stringify({time_requests:timeRequests, home_settings:homeSettings}), (err) => { console.log(err) })
}



if (existsSync(json_data_path)) {
    let data
    try {
        data = JSON.parse(readFileSync(json_data_path, 'utf-8'))
    } catch(err) {
        data = {time_requests:{}, home_settings:{}}
    }
    timeRequests = data["time_requests"]
    homeSettings = data["home_settings"]
} else {
    timeRequests = {}
    homeSettings = {}
    saveData()
}

export async function handleHoursRequest(uid: string, hrs: number, activity: string) {
    let user_info = await slack_app.client.users.info({
        user: uid
    });
    let name = user_info.user!.real_name!
    let request_id = uuidV4()
    
    
    
    let blocks = getRequestBlocks(uid, hrs, activity, request_id)
    let message = await slack_app.client.chat.postMessage({ channel: slack_approver_id, text: getSubmittedAltText(name, hrs, activity), blocks: blocks })
    timeRequests[request_id] = { 
        name: name, 
        time: hrs, 
        userId: uid,
        activity: activity, 
        requestMessage: {
            channel: message.channel!,
            ts: message.ts!,
            text: message.message!.text!,
            blocks: message.message!.blocks!
        }
    }
    saveData()
}
// INIT SLACK 

const slack_app = new App({
    token: token,
    signingSecret: signing_secret,
    socketMode: true,
    appToken: app_token,
    // logLevel: LogLevel.DEBUG
    
});

//SLACK EVENTS HANDLER

slack_app.command('/log', handleLogCommand)
slack_app.command('/graph', handleGraphCommand)
slack_app.shortcut('log_hours', handleLogShortcut)

slack_app.action("accept", handleAcceptButton)
slack_app.action("reject", handleRejectButton)
slack_app.action("jump_url", async ({ack}) => {await ack()})
slack_app.action("selected_metric", handleLeaderboardAction)

slack_app.view("reject_message", handleRejectModal)
slack_app.view("time_submission", handleLogModal)


slack_app.event('app_home_opened', handleAppHomeOpened)

//START WORKING: 9:20

// PENDING REQUESTS

const sendPendingPing = async () => {
    var pendingRequests = Object.values(timeRequests)
    slack_app.client.chat.postMessage({
        channel: slack_approver_id,
        text: `${pendingRequests.length} pending time requests`,
        blocks: await getAllPendingRequestBlocks(slack_app.client)
    })
}
new CronJob('30 9 * * *', sendPendingPing, null, true, 'America/Los_Angeles').start()
console.log("Cron Job Scheduled!")


slack_app.start().then(async () => {
    console.log("Bot started")
})
