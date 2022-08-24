async function cmdGraphme(event) {
    console.log("run")
    if (existsSync(json_hours_record_path)) {
        if (hours_record == null) { hours_record = JSON.parse(readFileSync(json_hours_record_path)) }
        let hours_as_data = []
        
        if (event.text.split(' ').includes('-r')) { await recordHours() }
        
        let requester_name = (await slack_client.users.info({ user: event.user })).user.real_name
        
        
        let lastEntry = -1
        hours_record.data[requester_name].forEach(entry => { if(entry.hours.toFixed(1) != lastEntry){hours_as_data.push({ x: entry.date, y: entry.hours.toFixed(1) }); lastEntry = entry.hours.toFixed(1) }})
        
        let full_url = `https://quickchart.io/chart?c=${encodeURIComponent(JSONfn.stringify(getTimeChartSpecs(requester_name, hours_as_data)))}&backgroundColor=white`.replace('%22YEET%22', encodeURIComponent("(value,context)=>{return value.y}").replace("\%22", ""))
        let short_url = await TinyURL.shorten(full_url)
        
        slack_client.chat.postMessage({ channel: event.channel, blocks: [{ "type": "image", image_url: short_url, "alt_text": "inspiration" }] })
        
    } else {
        slack_client.chat.postMessage({ channel: event.channel, text: ":exclamation:No data has been recorded yet! Try graphing tomorrow... _-abraham lincoln_" }).catch((err) => { console.log(err) })
    }
}
async function cmdGraph(event) {
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
            requester_name = (await slack_client.users.info({ user: event.user })).user.real_name
        }
        
        if (requester_name in hours_record.data) { hours_record.data[requester_name].forEach(entry => { hours_as_data.push({ x: entry.date, y: entry.hours.toFixed(1) }) }) }
        else { Object.entries(hours_record.data).forEach(entry => { if (new String(requester_name).toLowerCase().includes(new String(entry[0]).toLowerCase())) { entry[1].forEach((entry) => { hours_as_data.push({ x: entry.date, y: entry.hours.toFixed(1) }) }) } }) }
        
        
        // {hours_record.data[requester_name].forEach(entry=>{hours_as_data.push({x:entry.date,y:entry.hours.toFixed(1)})})}
        
        let full_url = `https://quickchart.io/chart?c=${encodeURIComponent(JSONfn.stringify(getTimeChartSpecs(requester_name, hours_as_data)))}&backgroundColor=white`.replace('%22YEET%22', encodeURIComponent("(value,context)=>{return value.y}").replace("\%22", ""))
        let short_url = await TinyURL.shorten(full_url)
        
        slack_client.chat.postMessage({ channel: event.channel, blocks: [{ "type": "image", image_url: short_url, "alt_text": "inspiration" }] })
        
    } else {
        slack_client.chat.postMessage({ channel: event.channel, text: ":exclamation:No data has been recorded yet! Try graphing tomorrow... _-abraham lincoln_" }).catch((err) => { console.log(err) })
    }
}

export function getTimeChartSpecs(name, dataList) {
    console.log(dataList)
    return {
        type: 'line',

        data: {
            datasets: [{

                // label: 'Hours',
                data: dataList,
                lineTension: 1,
                cubicInterpolationMode: "monotone",
                borderWidth: 5,
                fill: false,
                pointRadius: 5,
                // steppedLine: false,
                borderColor: "#29d9b9",
                pointBorderWidth: 2,
                pointBorderColor: "white",
                pointBackgroundColor: "#00d1ac",
                // pointHitRadius:2,
            }]
        },
        options: {
            plugins: {
                // 	datalabels: {
                // 	  color:'#29d9b9',
                // 	  font: {size:15,weight:'bold',familly:''},
                //    //   opacity:.7,
                // 	  display: true,
                // 	  align: 'bottom',
                // 		display: 'auto',
                // 	 backgroundColor: 'white',
                // 	//   borderRadius: 1000,
                // 	  formatter: "YEET"
                // 	},
            },
            legend: { display: false },
            title: { display: true, text: `${name}\'s Cumulative Hours from ${(new Date(dataList[0].x)).toDateString()} - ${(new Date(dataList[dataList.length - 1].x)).toDateString()}` },
            scales: {
                xAxes: [{
                    type: 'time',
                    // distribution: 'linear',
                    time: {
                        unit: 'day',
                    }
                }]
            }
        }
    }
}
