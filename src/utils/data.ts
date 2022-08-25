import { existsSync, readFileSync, writeFile } from 'fs';
import { json_data_path } from '../consts';
import { v4 as uuidV4 } from "uuid";

export async function saveData() {
    writeFile(json_data_path, JSON.stringify({ time_requests: timeRequests, home_settings: homeSettings, slack_approvers: slackApproverIDs }), (err) => { console.log(err) })
}

export function loadData() {
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
}

