import { readFileSync } from 'fs';
import { GoogleSpreadsheet } from "google-spreadsheet";
import { hours_sheet_id, log_sheet_name } from "./consts";

let googleDriveAuthed = false;
let sheet

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
    let currentTime = Date.now()/1000
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

