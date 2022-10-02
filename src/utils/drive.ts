import { GoogleSpreadsheet } from "google-spreadsheet";
import type GoogleSpreadsheetWorksheet from 'google-spreadsheet/lib/GoogleSpreadsheetWorksheet';
import { cluck_baseurl, hours_sheet_id, cluck_api_key, cluck_api_id } from '../../secrets/consts';
import { log_sheet_name } from "../consts";
import google_client_secret from '../../secrets/client_secret.json';
import type { LogRow } from '../types';
import fetch from 'node-fetch';

let googleDriveAuthed = false;
let sheet: GoogleSpreadsheetWorksheet

const cluck_api_token = Buffer.from(cluck_api_id).toString("base64")+":"+Buffer.from(cluck_api_key).toString("base64");

// Initialize Google Drive client
(async () => {
    const doc = new GoogleSpreadsheet(hours_sheet_id)
    await doc.useServiceAccountAuth(google_client_secret)
    await doc.loadInfo()
    sheet = doc.sheetsByTitle[log_sheet_name]
})().then(async () => {
    googleDriveAuthed = true;
})



export async function addHours(name, hours, activity){
    // Use CLUCK API calls to keep the logic in one place and avoid concurrent access issues
    const response = await fetch(cluck_baseurl + "/api/log", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name:name,
            hours:hours,
            activity:activity,
            api_key:cluck_api_token
        })
    })

    if (!response.ok) {
        throw new Error(`Could not add ${hours} hours for ${name}. ${response.statusText}`)
    }
}

export async function getMembers() {
    return await (await fetch(cluck_baseurl+"/api/members")).json()
}


export async function voidHours(name:string):Promise<number>{
    const response = await fetch(cluck_baseurl + "/api/void", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name:name,
            api_key:cluck_api_token
        })
    })
    return response.status
}

export async function getHours(): Promise<LogRow[]> {
    if (!googleDriveAuthed) return [];
    await sheet.loadCells()
    const rows = await sheet.getRows()
    return rows.map(row => {
        return {
            time_in: new Date(parseInt(row._rawData[0]+ "000")),
            time_out: new Date(parseInt(row._rawData[1]+ "000")),
            name: row._rawData[2],
            hours: parseFloat(row._rawData[3]),
            type: row._rawData[4] == "lab"? "lab":"external",
        }
    })
}

export async function waitForGoogleDrive() {
    while (!googleDriveAuthed) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
}
