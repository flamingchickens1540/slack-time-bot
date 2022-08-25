import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";
import type { KnownBlock, WebClient } from "@slack/web-api";
import { slack_admin_id } from "../consts";
import type { LeaderboardType, StaticSelectActionMiddlewareArgs } from "../types";
import { saveData } from "../utils/data";
import { settingsButton } from "../views/settings";
import { getLeaderboardView } from "../views/app_home";




export async function handleAppHomeOpened({ body, event, client }: SlackEventMiddlewareArgs<'app_home_opened'> & AllMiddlewareArgs) {
    // Don't update when the messages tab is opened
    if (body.event.tab == 'home') {
        publishDefaultHomeView(event.user, client)
    }
}

export async function publishDefaultHomeView(user: string, client: WebClient) {
    if (user == slack_admin_id || slackApproverIDs.includes(user)) {
        await publishHomeView(user, client, settingsButton, ...await getLeaderboardView(user))
    } else {
        await publishHomeView(user, client, ...await getLeaderboardView(user))
    }
}

export async function publishHomeView(user: string, client: WebClient, ...blocks: KnownBlock[]) {
    await client.views.publish({
        user_id: user,
        view: {
            type: "home",
            blocks: blocks
        }
    })
}


export async function handleLeaderboardAction({ ack, client, body, action }: StaticSelectActionMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    let selected_metric = action.selected_option.value
    if (typeof (homeSettings[body.user.id]) === 'undefined') {
        homeSettings[body.user.id] = {
            leaderboard_type: selected_metric as LeaderboardType
        }
    } else {
        homeSettings[body.user.id].leaderboard_type = selected_metric as LeaderboardType
    }
    publishDefaultHomeView(body.user.id, client)
    await saveData()
}