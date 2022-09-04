import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";
import type { KnownBlock, WebClient } from "@slack/web-api";
import type { LeaderboardType, StaticSelectActionMiddlewareArgs } from "../types";
import { ensureSettingsExist, saveData, data } from "../utils/data";
import { getLeaderboardView } from "../views/app_home";
import { settingsButton } from "../views/settings";




export async function handleAppHomeOpened({ body, event, client }: SlackEventMiddlewareArgs<'app_home_opened'> & AllMiddlewareArgs) {
    // Don't update when the messages tab is opened
    if (body.event.tab == 'home') {
        publishDefaultHomeView(event.user, client)
    }
}

export async function publishDefaultHomeView(user: string, client: WebClient) {
    await publishHomeView(user, client, settingsButton, ...await getLeaderboardView(user))
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
    const selected_metric = action.selected_option.value

    ensureSettingsExist(body.user.id)
    data.userSettings[body.user.id].leaderboard_type = selected_metric as LeaderboardType
    
    publishDefaultHomeView(body.user.id, client)
    await saveData()
}