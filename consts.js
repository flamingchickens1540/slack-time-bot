export const bot_port = 8000;
export const slash_port = process.env.PORT || 4050;
export const json_data_path = 'data.json'
export const hours_column = 4
export const name_column = 0;
export const max_row = 41;
export const hours_sheet_id = '1-j-sAjyLNufVCZUzr4fnkDNj8JPIN9o8t6_-CuopHSY'
export const dmRejection = true;
export const initing = true;

export const log_modal = {
	"type": "modal",
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
	return `:clock2: You submitted *${hours} hour${s}* for activity:\n>\`${activity}\``
	// return `:white_check_mark: You submitted *${hours} hours* for activity:\n\`\`\`${activity}\`\`\``
	// return `:clock2: You submitted \'${hours}\' hours for activity \'${activity}\'`
// 
}

export const getAcceptedDm = (pigChumpId, hours,activity)=>{
	return `:white_check_mark: *<@${pigChumpId}>* accepted *${hours} hours* for activity:\n>\`${activity}\``
}
export const getDeclinedDm = (pigChumpId, hours,activity)=>{
	return `:x: *<@${pigChumpId}>* declined *${hours} hours* for activity:\n>\`${activity}\``
}


export const getSubmittedDmHrsAndMins = (hrs,mins,activity)=>{
	let s = 's'
	if(hrs===1) {s = ''}
	let sm = 's'
	if(mins===1) {sm = ''}
	if(hrs===0) {
		return `:clock2: You submitted *${mins} minute${sm}* for activity:\n>\`${activity}\``
	} else if(mins===0) {
		return `:clock2: You submitted *${hrs} hour${s}* for activity:\n>\`${activity}\``
	} else {
		return `:clock2: You submitted *${hrs} hour${s}, ${mins} minute${sm}* for activity:\n>\`${activity}\``
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
					"value": `${mid}`
				},
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "Decline"
					},
					"style": "danger",
					"value": "decline"
				}
			]
		},
		{
			"type": "divider"
		}
	]
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