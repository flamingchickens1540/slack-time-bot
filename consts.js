export const bot_port = 8000;
export const slash_port = process.env.PORT || 5000;
export const json_data_path = 'data.json'
export const json_hours_record_path = "hours.json" 
export const hours_column = 4
export const total_hours_column = 5
export const global_hours_label_column = 4
export const global_hours_value_column = 5
export const name_column = 0;
export const max_row = 41;
export const hours_sheet_id = '10AcplDpfbXlECQYaFuTFcIeN2U8raP9XysuN3e31js0' // REAL SHEET
// export const hours_sheet_id = '1HrqjjiX9Hghol3ugSFyL8Hslag59cUP88hAgJHW-TUU' // TEST SHEET
export const dmRejection = true;
export const initing = true;

export const log_modal = {
	"type": "modal",
	"private_metadata":"time_submission",
	"title": {
		"type": "plain_text",
		"text": "Log Work Time",
		"emoji": true
	},
	"submit": {
		"type": "plain_text",
		"text": "Submit",
		"emoji": true
	},
	"close": {
		"type": "plain_text",
		"text": "Cancel",
		"emoji": true
	},
	"blocks": [
		// {
		// 	"type": "image",
		// 	"image_url": "https://i.ibb.co/WfXVHyv/Untitled.png",
		// 	"alt_text": "doser gives u love"
		// },
		{
			"type": "input",
			"block_id": "hours",
			"element": {
				"type": "plain_text_input",
				"action_id": "hours"
			},
			"label": {
				"type": "plain_text",
				"text": "Hours Spent",
				"emoji": true
			}
		},
		{
			"type": "input",
			"block_id": "task",
			"element": {
				"type": "plain_text_input",
				"multiline": true,
				"action_id": "task"
			},
			"label": {
				"type": "plain_text",
				"text": "Activity",
				"emoji": true
			}
		}
	]
};

export const getSubmittedBlocks = (hours,activity)=>{

	let blocks = [
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": `:clock2: You submitted *${hours} hours* for activity\n>_\`\`\`${activity}\`\`\`_`
				}
			},
			{
				"type": "context",
				"elements": [
					{
						"type": "plain_text",
						"text": "*TimeBot will let you know when these hours have been approved",
						"emoji": true
					}
				]
			}
		]

	return blocks;

}

export const getSubmittedDm = (hours,activity)=>{
	let s = 's'
	if(hours===1) {s = ''}
	// return `:clock2: You submitted *${hours} hour${s}* for activity:\n>\`${activity}\``
	return `:clock2: You submitted *${hours} hour${s}* :clock7:\n>>>:person_climbing: *Activity:*\n\`${activity}\``

	// return `:white_check_mark: You submitted *${hours} hours* for activity:\n\`\`\`${activity}\`\`\``
	// return `:clock2: You submitted \'${hours}\' hours for activity \'${activity}\'`
// 
}

export const getAcceptedDm = (pigChumpId, hours,activity)=>{
	// return `:white_check_mark: *<@${pigChumpId}>* accepted *${hours} hours* for activity:\n>\`${activity}\``
	return `:white_check_mark: *<@${pigChumpId}>* accepted *${hours} hours :white_check_mark:*\n>>>:person_climbing: *Activity:*\n\`${activity}\`
	`
}
export const getDeclinedDm = (pigChumpId, hours,activity)=>{
	// return `:x: *<@${pigChumpId}>* declined *${hours} hours* for activity:\n>\`${activity}\``
	return `:x: *<@${pigChumpId}>* declined *${hours} hours* for activity:\n>\`${activity}\``

}
export const getDeclinedMessageDM = (uid,hours,activity,message)=>{
	// return  `:x: *<@${uid}>* declined *${hours} hours* for activity:\n>>>\`${activity}\`\n:loudspeaker: *Message:*\n\`${message}\``
	return  `:x: *<@${uid}>* declined *${hours} hours* :x:\n>>>:person_climbing: *Activity:*\n\`${activity}\`\n:loudspeaker: *Message:*\n\`${message}\``

}


export const getSubmittedDmHrsAndMins = (hrs,mins,activity)=>{
	let s = 's'
	if(hrs===1) {s = ''}
	let sm = 's'
	if(mins===1) {sm = ''}
	if(hrs===0) {
		// return `:clock2: You submitted *${mins} minute${sm}* for activity:\n>\`${activity}\``
		return `:clock6: You submitted *${mins} minute${sm}* :clock1030:\n>>>:person_climbing: *Activity:*\n\`${activity}\``
		
	} else if(mins===0) {
		// return `:clock2: You submitted *${hrs} hour${s}* for activity:\n>\`${activity}\``
		return `:clock8: You submitted *${hrs} hour${s}* :clock330:\n>>>:person_climbing: *Activity:*\n\`${activity}\``
	} else {
		// return `:clock2: You submitted *${hrs} hour${s}, ${mins} minute${sm}* for activity:\n>\`${activity}\``
		return `:clock11: You submitted *${hrs} hour${s}, ${mins} minute${sm}* :clock5:\n>>>:person_climbing: *Activity:*\n\`${activity}\``
		
	}
	
	// return `:white_check_mark: You submitted *${hours} hours* for activity:\n\`\`\`${activity}\`\`\``
	// return `:clock2: You submitted \'${hours}\' hours for activity \'${activity}\'`
// 
}

export const getRequestBlockList = (uid,hrs,mins,activity,mid)=>{
	let s = 's'
	if(hrs===1) {s = ''}
	let sm = 's'
	if(mins===1) {sm = ''}
	let timeArg;
	if(hrs===0) {
		timeArg = `${mins} minute${sm}`
	} else if(mins===0) {
		timeArg = `${hrs} hour${s}`
	} else {
		timeArg = `${hrs} hour${s}, ${mins} minute${sm}`
	}




	// return [
	// 	{
	// 		"type": "header",
	// 		"text": {
	// 			"type": "plain_text",
	// 			"text": "Time Submission",
	// 			"emoji": true
	// 		}
	// 	},
	// 	{
	// 		"type": "section",
	// 		"text": {
	// 			"type": "mrkdwn",
	// 			"text": `>>>*<@${uid}>* submitted *${timeArg}* for activity\n\`${activity}\``
	// 		}
	// 	},
	// 	{
	// 		"type": "actions",
	// 		"elements": [
	// 			{
	// 				"type": "button",
	// 				"text": {
	// 					"type": "plain_text",
	// 					"emoji": true,
	// 					"text": "Add to Sheet"
	// 				},
	// 				"style": "primary",
	// 				"value": `${mid}`
	// 			},
	// 			{
	// 				"type": "button",
	// 				"text": {
	// 					"type": "plain_text",
	// 					"emoji": true,
	// 					"text": "Decline"
	// 				},
	// 				"style": "danger",
	// 				"value": "decline"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"type": "divider"
	// 	}
	// ]












	return [
			{
				"type": "header",
				"text": {
					"type": "plain_text",
					"text": "Time Submission",
					"emoji": true
				}
			},
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": `>>>*<@${uid}>* submitted *${timeArg}* for activity\n\`${activity}\``
				}
			},
			{
				"type": "actions",
				"elements": [
					{
						"type": "button",
						"text": {
							"type": "plain_text",
							"emoji": true,
							"text": "Add to Sheet"
						},
						"style": "primary",
						"value": `accept,${mid}`
					},
					{
						"type": "button",
						"text": {
							"type": "plain_text",
							"emoji": true,
							"text": "Decline w/ Message"
						},
						style:"danger",
						"value": `message,${mid}`
					// },
					// {
					// 	"type": "button",
					// 	"text": {
					// 		"type": "plain_text",
					// 		"emoji": true,
					// 		"text": "Decline"
					// 	},
					// 	"style": "danger",
					// 	"value": "decline"
					}
				]
			},
			{
				"type": "divider"
			}
		]






}

export const pendingRequestsMessageBlocks = (countList)=>{

	let list = ""
	countList.forEach(person => {
		list += `• ${person.name} (${person.count})\n`
	});

	return [
		{
			"type": "header",
			"text": {
				"type": "plain_text",
				"text": "Today's Pending Time Requests:",
				"emoji": true
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `>>>${list}`
			}
		}
	]
}

export const sendDeclineMessageModal = (name,hours,activity,ts,channel,rid)=>{
    return {
        "type":"modal",
		"private_metadata":`decline_message,${ts},${channel},${rid}`,
        "title": {
            "type": "plain_text",
            "text": "Decline Time Request",
            "emoji": true
        },
        "submit": {
            "type": "plain_text",
            "text": "Decline and Send",
            "emoji": true
        },
        "type": "modal",
        "close": {
            "type": "plain_text",
            "text": "Cancel",
            "emoji": true
        },
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `_*${name}*_ submitted *${hours} hours* for activity\n\n>_\`\`\`${activity}\`\`\`_`
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "input",
				"block_id": "message",
                "element": {
                    "type": "plain_text_input",
                    "multiline": true,
                    "action_id": "input"
                },
                "label": {
                    "type": "plain_text",
                    "text": "Decline and Send Message to Micah Powch",
                    "emoji": true
                }
            }
        ]
    }
}


export const addedFooter = {
	"type": "section",
	"text": {
		"type": "mrkdwn",
		"text": "*_:white_check_mark: ADDED :white_check_mark:_*"
	}
}

export const declinedFooter = {
	"type": "section",
	"text": {
		"type": "mrkdwn",
		"text": "*_:x: DECLINED :x:_*"
	}
}

export const declinedWithMessage = (message)=>{
	return [{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "*_:x: DECLINED WITH MESSAGE: :x:_*"
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `>\`${message}\``
			}
		}]
}


export const getTimeChartSpecs = (name,dataList)=>{
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
			borderColor:"#29d9b9",
			pointBorderWidth:2	,
			pointBorderColor:"white",
			pointBackgroundColor:"#00d1ac",
			// pointHitRadius:2,
		  }]
		},
	   options: {
		 plugins: {
			datalabels: {
			  color:'#29d9b9',
			  font: {size:15,weight:'bold',familly:''},
		   //   opacity:.7,
			  display: true,
			  align: 'bottom',
				display: 'auto',
			 backgroundColor: 'white',
			//   borderRadius: 1000,
			  formatter: "YEET"
			},
		  },
			 legend: {display:false},
			title:{display:true,text:`${name}\'s Cumulative Hours from ${(new Date(dataList[0].x)).toDateString()} - ${(new Date(dataList[dataList.length-1].x)).toDateString()}`},
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




