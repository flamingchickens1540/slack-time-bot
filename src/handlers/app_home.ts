import type { AppHomeOpenedEvent, BlockAction, ButtonAction, SlackEventMiddlewareArgs, SlackViewMiddlewareArgs, StaticSelectAction, ViewSubmitAction } from "@slack/bolt";
import type { WebClient } from "@slack/web-api";
import { saveData } from "..";
import { ButtonActionMiddlewareArgs, LeaderboardType, LogRow, StaticSelectActionMiddlewareArgs } from "../consts";
import { getHours } from "../utils/drive";
import { getLeaderboardView } from "../views/leaderboard_view";

type LeaderboardEntry = { name: string, hours: number }
type LeaderboardFilter = (value: LogRow, index: number, array: LogRow[]) => boolean

export async function handleAppHomeOpened({ ack, body, event, client }: SlackEventMiddlewareArgs<'app_home_opened'> & { client: WebClient }) {
    
    if (body.event.tab == 'home') {
        console.log("App home opened")
        await publishHomeView(event.user, client)
    }
}

export async function publishHomeView(user: string, client: WebClient) {
    if (typeof (homeSettings[user]) === 'undefined') {
        homeSettings[user] = {
            leaderboard_type: 'total'
        }
    }

    let settings = homeSettings[user]
    
    // Get the leaderboard
    let hours = await getHours()
    let elegible_hours = hours.filter(leaderboardFilters[settings.leaderboard_type])
    let people: { [key: string]: LeaderboardEntry } = {}
    
    // Sum the hours for each person
    elegible_hours.forEach(row => {
        if (typeof (people[row.name]) === 'undefined') {
            people[row.name] = { name: row.name, hours: 0 }
        }
        people[row.name].hours += row.hours
    })

    // Sort the people by hours, reversed
    let sorted = Object.values(people).sort((a, b) => b.hours - a.hours).slice(0, 10)
    let leaderboard_data = sorted.map(({ name, hours }) => ({ name: name, hours: hours.toFixed(1) }))

    await client.views.publish({
        user_id: user,
        view: getLeaderboardView(leaderboard_data, settings.leaderboard_type)
    })
}


export async function handleLeaderboardAction({ ack, client, body, action }: StaticSelectActionMiddlewareArgs & { client: WebClient }) {
    await ack()
    let selected_metric = action.selected_option.value
    if (typeof (homeSettings[body.user.id]) === 'undefined') {
        homeSettings[body.user.id] = {
            leaderboard_type: selected_metric as LeaderboardType
        }
    } else {
        homeSettings[body.user.id].leaderboard_type = selected_metric as LeaderboardType
    }
    publishHomeView(body.user.id, client)
    await saveData()
}




const getTotalHoursLeaderboard: LeaderboardFilter = (value) => { return true }
const getWeeklyHoursLeaderboard: LeaderboardFilter = (value) => {
    // Get date 7 days ago
    let date = new Date().getTime() - (7 * 24 * 60 * 60 * 1000)
    return value.time_out.getTime() > date
}
const getExternalHoursLeaderboard: LeaderboardFilter = (value) => { return value.type == 'external' }
const getLabHoursLeaderboard: LeaderboardFilter = (value) => { return value.type == 'lab' }

const leaderboardFilters: { [key: string]: LeaderboardFilter } = {
    'total': getTotalHoursLeaderboard,
    'weekly': getWeeklyHoursLeaderboard,
    'external': getExternalHoursLeaderboard,
    'lab': getLabHoursLeaderboard
}


