import { existsSync, readFileSync, writeFile } from 'fs';
import { json_data_path } from '../consts';
import { v4 as uuidV4 } from "uuid";
import { UserSettings } from '../types';

export async function saveData() {
    writeFile(json_data_path, JSON.stringify({ time_requests: timeRequests, user_settings: userSettings, slack_approvers: slackApproverIDs }), (err) => { console.log(err) })
}

export function loadData() {
    if (existsSync(json_data_path)) {
        let data
        try {
            data = JSON.parse(readFileSync(json_data_path, 'utf-8'))
        } catch (err) {
            data = { time_requests: {}, user_settings: {}, slack_approvers: [] }
        }
        timeRequests = data["time_requests"]
        userSettings = data["user_settings"]
        slackApproverIDs = data["slack_approvers"]
    } else {
        timeRequests = {}
        userSettings = {}
        slackApproverIDs = []
        saveData()
    }
}

export function getSettings(user_id):UserSettings {
    ensureSettingsExist(user_id)
    return userSettings[user_id]
}

export async function ensureSettingsExist(user_id) {
    if (typeof (userSettings[user_id]) === 'undefined') {
        let user = await slack_client.users.info({ user: user_id })
        userSettings[user_id] = {
            leaderboard_type: "department",
            real_name: user.user!.real_name!
        }
    }
}
