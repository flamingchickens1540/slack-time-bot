import { existsSync, readFileSync, writeFile } from 'fs';
import { slack_client } from '..';
import { json_data_path } from '../consts';
import { TimeRequest, UserSettings } from '../types';

export let data:Data = {
    timeRequests: {},
    userSettings: {},
    slackApproverIDs: []
}
type Data = {
    timeRequests: { [key: string]: TimeRequest }
    userSettings: { [key: string]: UserSettings }
    slackApproverIDs: string[]
}
export async function saveData() {
    writeFile(json_data_path, JSON.stringify(data, null, 4), (err) => { if (err != null) console.log(err) })
}

export function loadData() {
    if (existsSync(json_data_path)) {
        try {
            data = JSON.parse(readFileSync(json_data_path, 'utf-8'))
        } catch (err) { console.warn(err) }
    } else {
        saveData()
    }
}


export function getSettings(user_id):UserSettings {
    ensureSettingsExist(user_id)
    return data.userSettings[user_id]
}

export async function ensureSettingsExist(user_id) {
    if (typeof (data.userSettings[user_id]) === 'undefined') {
        const user = await slack_client.users.info({ user: user_id })
        data.userSettings[user_id] = {
            leaderboard_type: "department",
            real_name: user.user!.real_name!
        }
    }
}
