import { WebClient } from "@slack/web-api"
import { createEventAdapter } from "@slack/events-api"
import lineByLine from 'n-readlines';

import http from 'http';
import https from 'https';
// const {WebClient} = require('@slack/web-api');
// const{createEventAdapter} = require('@slack/events-api')
import { sendDeclineMessageModal, getTimeChartSpecs, bot_port, slash_port, log_modal, getSubmittedDm, getSubmittedDmHrsAndMins, json_data_path, getRequestBlockList, addedFooter, declinedFooter, max_row, name_column, hours_column, hours_sheet_id, getAcceptedDm, getDeclinedDm, dmRejection, initing, declinedWithMessage, getDeclinedMessageDM, pendingRequestsMessageBlocks, json_hours_record_path, total_hours_column, global_hours_label_column, global_hours_value_column } from './consts.js'
import { signin_secret, token } from './slack_secrets.js'
import { existsSync, readFile, readFileSync, writeFile, writeFileSync } from 'fs'

import { promisify } from 'util'
import { setupMaster } from "cluster";
import { GoogleSpreadsheet } from "google-spreadsheet";
import TinyURL from 'tinyurl'

import "cron"
import { CronJob } from "cron";

const writeJSON = async function () {
    writeFile(json_data_path, JSON.stringify(DATA), (err) => { console.log(err) })
}

let DATA
if (existsSync(json_data_path)) {
    DATA = JSON.parse(readFileSync(json_data_path))
} else {
    DATA = { "e": {} }
    writeJSON()
}

const handleHoursRequest = async function (uid, hrs, mins, activity) {
    if (!('rnum' in DATA)) {
        DATA['rnum'] = 0;
    }
    DATA['rnum'] = DATA['rnum'] + 1;

    // try{
    const result = await post.users.info({
        user: uid
    });
    // } catch (err) {console.log(err)}

    if (!('e' in DATA)) { DATA['e'] = {} }
    DATA['e'][DATA['rnum']] = { name: result['user']['real_name'], time: parseFloat(hrs + mins / 60).toFixed(1), userId: uid, activity: activity }
    writeJSON()

    let requestDmBlocks = getRequestBlockList(uid, hrs, mins, activity, DATA['rnum'])
    post.chat.postMessage({ channel: DATA['myLittlePogchamp'], blocks: requestDmBlocks })
}

let sheet;


///////////////// INIT SLACK 

const events = createEventAdapter(signin_secret);
const post = new WebClient(token);
let beeScript;
let fizz = false;

/////////////////// INIT GOOGLE DRIVE

let googleDriveAuthed = false;

let JSONfn = {}

JSONfn.stringify = (obj) => {
    return JSON.stringify(obj, function (key, value) {
        return (typeof value === 'function') ? '' + value : value;
    });
}

(async () => {
    const google_client_secret = JSON.parse(readFileSync('./client_secret.json'))
    const doc = await new GoogleSpreadsheet(hours_sheet_id)
    await doc.useServiceAccountAuth(google_client_secret)
    await doc.loadInfo()
    sheet = doc.sheetsByIndex[0]
})().then(async () => {
    googleDriveAuthed = true;
})

async function addhours(name, hours) {
    await sheet.loadCells({ startRowIndex: 0, endRowIndex: max_row + 1, startColumnIndex: name_column, endColumnIndex: hours_column + 1 })
    for (let y = 0; y < max_row; y++) {
        // console.log(y)
        const name_cell = sheet.getCell(y, name_column)

        if (name.includes(name_cell.value) && name_cell.value != "" && name_cell.value != " ") {
            const hours_cell = sheet.getCell(y, hours_column)
            if('d'+hours_cell.formula == 'dnull') {
                if(hours_cell.value) {
                    hours_cell.formula = `=${hours_cell.value}`
                } else {
                    hours_cell.formula = `=`
                }
            }
            hours_cell.formula = `${hours_cell.formula}+${parseFloat(hours).toFixed(1)}`
            hours_cell.save()
            return
        }

    }
    post.chat.postMessage({ channel: DATA['myLittlePogchamp'], text: `:warning: Could not find member *${name}* in spreadsheet` })
}


////// COLLECT HOURS DATA
let hours_record

const recordHours = async () => {
    if (!googleDriveAuthed) { return }
    if (!existsSync(json_hours_record_path)) {
        writeFileSync(json_hours_record_path, JSON.stringify({ data: {} }))
    }
    hours_record = JSON.parse(readFileSync(json_hours_record_path))
    await sheet.loadCells({ startRowIndex: 0, endRowIndex: max_row + 1, startColumnIndex: name_column, endColumnIndex: total_hours_column + 1 })
    for (let y = 0; y < max_row; y++) {
        // console.log(y)
        const name_cell = sheet.getCell(y, name_column)
        const cum_label_cell = sheet.getCell(y, global_hours_label_column)


        if (name_cell.value != null && name_cell.value != "") {
            const hours_cell = sheet.getCell(y, total_hours_column)
            if (!(hours_cell.value == null || hours_cell.value == "")) {
                if (!(name_cell.value in hours_record.data)) { hours_record.data[name_cell.value] = [] }
                hours_record.data[name_cell.value].push({ date: new Date(), hours: hours_cell.value })
            }
        } else if (cum_label_cell.value === "Total") {
            const cum_value_cell = sheet.getCell(y, global_hours_value_column)
            if (!("total" in hours_record.data)) { hours_record.data["total"] = [] }
            hours_record.data.total.push({ date: new Date(), hours: cum_value_cell.value })
        }
    }
    writeFileSync(json_hours_record_path, JSON.stringify(hours_record))
}

// Record hour data every midnight
new CronJob('0 0 * * *', recordHours, {
    scheduled: true,
    timezone: "America/Los_Angeles"
}).start()











//////////// SLACK EVENTS HANDLER

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const atCommands = {
    "buzz": async (event) => {
        // if (beeScript==undefined) {
        // beeScript = readline.createInterface({
        //     input: fs.createReadStream('/path/to/file'),
        //     output: process.stdout,
        //     console: false })
        // }

        beeScript = new lineByLine('./buzz.txt');
        let beeLine;

        while ((beeLine = beeScript.next().toString()) && !fizz) {
            // console.log(beeLine);
            post.chat.postMessage({ channel: event.channel, text: beeLine }).catch((err) => console.log(err));
            await sleep(1000);
        }
        fizz = false;

        // for (let index = 0; index < 100; index++) {
        //     post.chat.postMessage({channel: event.channel, text:"you like jaAzzZ?"});
        // }

    }, "fizz": async (event) => {
        fizz = true;
    }, 'imyourlittlepogchamp': async (event) => {
        if (initing) {
            DATA['myLittlePogchamp'] = event.user
            writeJSON()
            console.log("UPDATED!")
        }
        console.log('run!')
    }, 'graphme': async (event) => {
        console.log("run")
        if (existsSync(json_hours_record_path)) {
            if (hours_record == null) { hours_record = JSON.parse(readFileSync(json_hours_record_path)) }
            let hours_as_data = []

            if (event.text.split(' ').includes('-r')) { await recordHours() }

            let requester_name = (await post.users.info({ user: event.user })).user.real_name



            hours_record.data[requester_name].forEach(entry => { hours_as_data.push({ x: entry.date, y: entry.hours.toFixed(1) }) })

            let full_url = `https://quickchart.io/chart?c=${encodeURIComponent(JSONfn.stringify(getTimeChartSpecs(requester_name, hours_as_data)))}&backgroundColor=white`.replace('%22YEET%22', encodeURIComponent("(value,context)=>{return value.y}").replace("\%22", ""))
            let short_url = await TinyURL.shorten(full_url)
            
            post.chat.postMessage({ channel: event.channel, blocks: [{"type": "image", image_url: short_url, "alt_text": "inspiration"}]})

        } else {
            post.chat.postMessage({ channel: event.channel, text: ":exclamation:No data has been recorded yet! Try graphing tomorrow... _-abraham lincoln_" }).catch((err) => { console.log(err) })
        }
    }, 'graph': async (event) => {



        if (existsSync(json_hours_record_path)) {
            if (hours_record == null) { hours_record = JSON.parse(readFileSync(json_hours_record_path)) }
            let hours_as_data = []
            let requester_name

            if (!event.text.split(" ")[2].includes("<@")) {
                if (event.text.split(" ")[2] === 'all' || event.text.split(" ")[2] === 'team') {
                    requester_name = 'total'
                    
                } else { return }
            } else {
                event.user = event.text.split(" ")[2].replace("<", "").replace(">", "").replace("@", "")
                requester_name = (await post.users.info({ user: event.user })).user.real_name
            }

            if (requester_name in hours_record.data) { hours_record.data[requester_name].forEach(entry => { hours_as_data.push({ x: entry.date, y: entry.hours.toFixed(1) }) }) }
            else { Object.entries(hours_record.data).forEach(entry => { if (requester_name.includes(entry[0])) { entry[1].forEach((entry) => { hours_as_data.push({ x: entry.date, y: entry.hours.toFixed(1) }) }) } }) }


            // {hours_record.data[requester_name].forEach(entry=>{hours_as_data.push({x:entry.date,y:entry.hours.toFixed(1)})})}

            let full_url = `https://quickchart.io/chart?c=${encodeURIComponent(JSONfn.stringify(getTimeChartSpecs(requester_name, hours_as_data)))}&backgroundColor=white`.replace('%22YEET%22', encodeURIComponent("(value,context)=>{return value.y}").replace("\%22", ""))
            let short_url = await TinyURL.shorten(full_url)

            post.chat.postMessage({ channel: event.channel, blocks: [{"type": "image", image_url: short_url, "alt_text": "inspiration"}]})

        } else {
            post.chat.postMessage({ channel: event.channel, text: ":exclamation:No data has been recorded yet! Try graphing tomorrow... _-abraham lincoln_" }).catch((err) => { console.log(err) })
        }
    }
};

events.on('app_mention', (event) => {
    //console.log(event.user);
    //console.log(event.text);
    let textSplit = event.text.split(" ");
    if (textSplit[1] in atCommands) {
        atCommands[textSplit[1]](event);
    }
    // console.log("sent!");
});

events.on('ready', () => {
    console.log("ready!");
});

events.start(bot_port).then(() => {
    console.log(`event listener started on port ${bot_port}`)
})

// console.log(new Date())
// console.log(Date.now())


//START WORKING: 9:20


///////////////// PENDING REQUESTS

const sendPendingPing = async () => {
    let pendingPeople = {};
    let pendingPeopleList = [];
    if (DATA.e == null || Object.entries(DATA.e) == null || Object.entries(DATA.e).length == 0) { return }
    Object.values(DATA.e).forEach(request => {
        if (pendingPeople[request.name] == null) {
            pendingPeople[request.name] = 0
        }
        pendingPeople[request.name] += 1
    })
    Object.entries(pendingPeople).forEach(entry => { pendingPeopleList.push({ name: entry[0], count: entry[1] }) })
    post.chat.postMessage({
        channel: DATA.myLittlePogchamp,
        blocks: pendingRequestsMessageBlocks(pendingPeopleList)
    })
}

// sendPendingPing()

new CronJob('1 30 9 * * *', sendPendingPing, null, true, 'America/Los_Angeles').start()
// new CronJob('* * * * * *', sendPendingPing, null, true, 'America/Los_Angeles').start()

console.log("Cron Job Started!")


const slashServer = http.createServer(async (request, response) => {

    if (request.method == "POST") {

        response.writeHead(200);

        // request.once('close',()=>{})


        let body = "";



        request.on('data', function (data) {
            body += data
            console.log('Partial body: ' + '\n' + body)
        })

        request.on('end', async (data) => {
            try {

                console.log(`full body: ${body}`)

                response.end()

                let split = body.split("&");
                let requestDict = {};
                split.forEach((value) => {
                    var i = value.indexOf('=');
                    var keyVal = [value.slice(0, i), value.slice(i + 1)];

                    requestDict[keyVal[0]] = decodeURIComponent(keyVal[1].replace(/\+/g, " "));

                })
                //console.log(requestDict)



                if ('payload' in requestDict) {
                    // response.writeHead(200,{'Content-type':'application/json'});
                    let real_json = JSON.parse(requestDict['payload']);
                    console.log(real_json)


                    // const data = JSON.stringify({
                    //     "trigger_id": real_json['trigger_id'],
                    //     "dialog": log_modal,
                    //     'token': token,
                    // });


                    if (real_json['type'] == 'shortcut') {

                        let payload = log_modal;
                        // payload['callback_id'] = real_json['callback_id'];
                        const data =
                            'token=' + encodeURIComponent(token) +
                            "&view=" + encodeURIComponent(JSON.stringify(payload)) +
                            "&trigger_id=" + encodeURIComponent(real_json['trigger_id'])



                        //console.log(data);


                        const options = {
                            hostname: 'slack.com',
                            path: '/api/views.open',
                            method: 'POST',
                            headers: {
                                // 'Content-type': 'application/json; charset=UTF-8',
                                'Content-type': 'application/x-www-form-urlencoded',


                                'Content-Length': data.length,
                                // 'Authorization': `Basic ${token}`,
                                "Authorization": `OAuth ${token}`
                            }
                        }



                        const req = https.request(options, res => {
                            console.log(`statusCode: ${res.statusCode}`)

                            res.on('data', d => {
                                process.stdout.write(d)
                            })
                        })

                        req.on('error', error => {
                            console.error(error)
                        })

                        req.write(data)
                        req.end()



                        // http.request()
                    } else if (real_json['type'] == 'view_submission') {
                        if (real_json.view.private_metadata === "time_submission") {
                            const channelId = real_json['user']['id'];
                            let hoursInput = real_json['view']['state']['values']['hours']['hours']['value'];
                            if (isNaN(hoursInput)) { return }
                            const hours = parseFloat(hoursInput);
                            const task = real_json['view']['state']['values']['task']['task']['value']
                            const blks = getSubmittedDm(hours, task)
                            try {
                                let boi = await post.chat.postMessage({ channel: channelId, text: blks })
                                //console.log(boi);
                            } catch (e) { console.log(e) }
                            handleHoursRequest(channelId, hours, 0, task)
                        } else {
                            let bits = real_json.view.private_metadata.split(",");

                            if (bits[0] === "decline_message") {
                                let oldBlocks;
                                try {
                                    oldBlocks = (await post.conversations.history({
                                        token: token,
                                        channel: bits[2],
                                        latest: bits[1],
                                        inclusive: true,
                                        limit: 1
                                    })).messages[0].blocks;
                                } catch (err) { console.log(err) }

                                try {
                                    post.chat.update({
                                        channel: bits[2],
                                        ts: bits[1],
                                        blocks: [oldBlocks[0], oldBlocks[1]].concat(declinedWithMessage(real_json.view.state.values.message.input.value), { "type": "divider" })
                                    })
                                } catch (err) { console.log(err) }
                                try {
                                    let metaData = DATA.e[bits[3]]
                                    post.chat.postMessage({
                                        channel: metaData.userId,
                                        text: getDeclinedMessageDM(DATA.myLittlePogchamp, metaData.time, metaData.activity, real_json.view.state.values.message.input.value)
                                    })
                                } catch (err) { console.log(err) }

                                delete DATA.e[bits[3]]
                                writeJSON()
                            }

                        }
                    } else if (real_json['type'] == 'block_actions') {

                        let ts = real_json['message']['ts'];
                        const oldBlocks = real_json['message']['blocks'];
                        // hBody = [oldBlocks[0],oldBlocks[1]]

                        let addId = real_json['actions'][0]['value'];

                        if (addId === 'decline') {
                            try {
                                post.chat.update({
                                    channel: real_json['container']['channel_id'],
                                    ts: ts,
                                    blocks: [oldBlocks[0], oldBlocks[1], declinedFooter,
                                    {
                                        "type": "divider"
                                    }]
                                })
                            } catch (err) { console.log(err) }
                            // if(dmRejection){post.chat.postMessage({channel: DATA['e'][addId]['userId'], text: getDeclinedDm(DATA['myLittlePogchamp'],DATA['e'][addId]['time'],DATA['e'][addId]['activity'])})}
                        } else {
                            let bits = addId.split(",")
                            if (bits[0] === "accept") {
                                addId = bits[1]
                                try {
                                    post.chat.update({
                                        channel: real_json['container']['channel_id'],
                                        ts: ts,
                                        blocks: [oldBlocks[0], oldBlocks[1], addedFooter,
                                        {
                                            "type": "divider"
                                        }]
                                    })
                                } catch (err) { console.log(err) }

                                // INTERFACE WITH GOOGLE API
                                // parseInt(real_json['actions'][0]['value'])
                                addhours(DATA['e'][addId]['name'], DATA['e'][addId]['time'])
                                await post.chat.postMessage({ channel: DATA['e'][addId]['userId'], text: getAcceptedDm(DATA['myLittlePogchamp'], DATA['e'][addId]['time'], DATA['e'][addId]['activity']) })
                                delete DATA['e'][addId]
                                writeJSON()
                            } else if (bits[0] === "message") {
                                let rid = bits[1]
                                let requestInfo = DATA['e'][rid]
                                try {
                                    post.views.open({
                                        trigger_id: real_json['trigger_id'],
                                        view: sendDeclineMessageModal(requestInfo.name, requestInfo.time, requestInfo.activity, ts, real_json.container.channel_id, rid)
                                    })
                                } catch (err) { console.log(err) }
                            }
                        }




                    }



                } else if (requestDict['command'] === '/log') {
                    console.log(requestDict)
                    let mins = 0, hours = 0, actStart = 0;
                    let args = requestDict['text'].split(" ")
                    if (args.length === 0 || args[0] === '') {
                        post.views.open({
                            view: log_modal,
                            trigger_id: requestDict['trigger_id']
                        })
                    } else if (args.length === 1) {

                    } else {
                        if (!isNaN(args[0].slice(0, args[0].length - 1))) {
                            console.log("sdfdgersdgSDJFHEJGHWEUIAGHERUISGJ STUFFFFFFF")
                            let val = parseFloat(args[0])
                            if (args[0].slice(-1) === 'h') {
                                hours = val;
                                actStart += 1;
                            } else if (args[0].slice(-1) === 'm') {
                                mins = val;
                                actStart += 1;
                            }
                        }
                        if (!isNaN(args[1].slice(0, args[1].length - 1))) {
                            let val = parseFloat(args[1])
                            if (args[1].slice(-1) === 'h') {
                                hours = val;
                                actStart += 1;
                            } else if (args[1].slice(-1) === 'm') {
                                mins = val;
                                actStart += 1;
                            }
                        }
                        let activity = args.slice(actStart, args.length).join(' ');
                        let msg_txt = getSubmittedDmHrsAndMins(hours, mins, activity);
                        let channelId = requestDict['channel_id'];
                        let userId = requestDict['user_id'];
                        if (!(requestDict.channel_name === "directmessage")) {
                            try {
                                let boi = await post.chat.postEphemeral({ channel: channelId, text: msg_txt, user: userId })
                                //console.log(boi);
                            } catch (e) { console.log(e) }
                        }
                        try {
                            let boi = await post.chat.postMessage({ channel: userId, text: msg_txt })
                            //console.log(boi);
                        } catch (e) { console.log(e) }

                        handleHoursRequest(userId, hours, mins, activity)

                    }
                }




            } catch (err) { console.log(err) }
            return
        })

    }
});




slashServer.listen(slash_port);











