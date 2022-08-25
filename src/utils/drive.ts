import { readFileSync } from 'fs';
import { GoogleSpreadsheet } from "google-spreadsheet";
import type GoogleSpreadsheetWorksheet from 'google-spreadsheet/lib/GoogleSpreadsheetWorksheet';
import { hours_sheet_id } from '../../secrets/consts';
import { log_sheet_name } from "../consts";

import type { LogRow } from '../types';

let googleDriveAuthed = false;
let sheet: GoogleSpreadsheetWorksheet

// Initialize Google Drive client
(async () => {
    const google_client_secret = JSON.parse(readFileSync('./secrets/client_secret.json', 'utf-8'))
    const doc = new GoogleSpreadsheet(hours_sheet_id)
    await doc.useServiceAccountAuth(google_client_secret)
    await doc.loadInfo()
    sheet = doc.sheetsByTitle[log_sheet_name]
})().then(async () => {
    googleDriveAuthed = true;
})

export async function addHours(name, hours) {
    if (!googleDriveAuthed) return;
    await sheet.loadCells()
    let currentTime = Date.now() / 1000
    // Add to sheet
    try {
        await sheet.loadCells()
        await sheet.addRow([currentTime, currentTime, name, hours.toFixed(2), 'external'])
        await sheet.saveUpdatedCells()
    } catch (e) {
        console.error(`Could not add time for ${name}`)
        console.error(e)
    }
}

export async function getHours(): Promise<LogRow[]> {
    if (!googleDriveAuthed) return [];
    await sheet.loadCells()
    let rows = await sheet.getRows()
    return rows.map(row => {
        return {
            time_in: new Date(parseInt(row._rawData[0]+ "000")),
            time_out: new Date(parseInt(row._rawData[1]+ "000")),
            name: row._rawData[2],
            hours: parseFloat(row._rawData[3]),
            type: row._rawData[4],
        }
    })
}

export async function waitForGoogleDrive() {
    while (!googleDriveAuthed) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
}
