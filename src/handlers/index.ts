export function sanitizeCodeblock(activity: string): string {
	return activity.replace("`", "'")
}
export function formatDuration(hrs: number, mins?: number): string {
	if (typeof (mins) === 'undefined') {
		let mins_cached = hrs * 60
		hrs = Math.floor(mins_cached / 60);
		mins = Math.round(mins_cached % 60);
	}
	let hours = hrs === 1 ? '1 hour' : `${hrs} hours`
	let minutes = mins === 1 ? '1 minute' : `${mins} minutes`

	if (hrs === 0) {
		return minutes
	} else if (mins === 0) {
		return hours
	} else {
		return `${hours} and ${minutes}`
	}
}


export const getSubmittedDm = (data: { hours: number, minutes?: number, activity: string }) => {
	return `:clock2: You submitted *${formatDuration(data.hours, data.minutes)}* :clock7:\n>>>:person_climbing: *Activity:*\n\`${sanitizeCodeblock(data.activity)}\``
}

export const getAcceptedDm = (user, hours, activity) => {
	return `:white_check_mark: *<@${user}>* accepted *${formatDuration(hours)}* :white_check_mark:\n>>>:person_climbing: *Activity:*\n\`${sanitizeCodeblock(activity)}\`
	`
}
export const getRejectedDm = (user, hours, activity, message) => {
	return `:x: *<@${user}>* rejected *${formatDuration(hours)}* :x:\n>>>:person_climbing: *Activity:*\n\`${sanitizeCodeblock(activity)}\`\n:loudspeaker: *Message:*\n\`${sanitizeCodeblock(message)}\``
}
