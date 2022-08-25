import { App } from "@slack/bolt";

import { existsSync, readFileSync, writeFile } from 'fs';
import { app_token, signing_secret, token } from '../secrets/slack_secrets.js';
import type { HomeSettings, TimeRequest } from './consts.js';
import { json_data_path } from './consts.js';

import "cron";
import { CronJob } from "cron";
import { v4 as uuidV4 } from "uuid";
import { handleAppHomeOpened } from "./handlers/app_home.js";
import { handleLeaderboardAction } from "./handlers/app_home_leaderboard.js";
import { handleAcceptButton } from "./handlers/button_accept.js";
import { handleRejectButton } from "./handlers/button_reject.js";
import { handleGraphCommand } from "./handlers/command_graph.js";
import { handleLogCommand, handleLogShortcut } from "./handlers/command_log.js";
import { handleLogModal } from "./handlers/modal_log.js";
import { handleRejectModal } from "./handlers/modal_reject.js";
import { handleOpenSettingsModal, handleSettingsSave } from "./handlers/modal_settings.js";
import { getAllPendingRequestBlocks, getSubmittedAltText } from "./messages.js";
import { getRequestBlocks } from "./views/new_request.js";



declare global {
    var timeRequests: { [key: string]: TimeRequest };
    var homeSettings: { [key: string]: HomeSettings };
    var slackApproverIDs: string[];
}
export async function saveData() {
    writeFile(json_data_path, JSON.stringify({ time_requests: timeRequests, home_settings: homeSettings, slack_approvers: slackApproverIDs }), (err) => { console.log(err) })
}



if (existsSync(json_data_path)) {
    let data
    try {
        data = JSON.parse(readFileSync(json_data_path, 'utf-8'))
    } catch (err) {
        data = { time_requests: {}, home_settings: {}, slack_approvers: [] }
    }
    timeRequests = data["time_requests"]
    homeSettings = data["home_settings"]
    slackApproverIDs = data["slack_approvers"]
} else {
    timeRequests = {}
    homeSettings = {}
    slackApproverIDs = []
    saveData()
}

export async function handleHoursRequest(uid: string, hrs: number, activity: string) {
    let user_info = await slack_app.client.users.info({
        user: uid
    });
    let name = user_info.user!.real_name!
    let request_id = uuidV4()


    timeRequests[request_id] = {
        name: name,
        time: hrs,
        userId: uid,
        activity: activity,
        requestMessages: {}
    }
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
slack_app.action("jump_url", async ({ ack }) => { await ack() })
slack_app.action("selected_metric", handleLeaderboardAction)
slack_app.action("open_settings_modal", handleOpenSettingsModal)

slack_app.view("reject_message", handleRejectModal)
slack_app.view("time_submission", handleLogModal)
slack_app.view("save_settings", handleSettingsSave)


slack_app.event('app_home_opened', handleAppHomeOpened)

//START WORKING: 9:20

// PENDING REQUESTS

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
new CronJob('30 9 * * *', sendPendingPing, null, true, 'America/Los_Angeles').start()
console.log("Cron Job Scheduled!")


slack_app.start().then(async () => {
    console.log("Bot started")
})
