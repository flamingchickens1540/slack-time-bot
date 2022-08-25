import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";
import type { KnownBlock, WebClient } from "@slack/web-api";
import { slack_admin_id } from "../consts";
import { settingsButton } from "../views/bot_settings_view";
import { getLeaderboardView } from "../views/leaderboard_view";



export async function handleAppHomeOpened({ body, event, client }: SlackEventMiddlewareArgs<'app_home_opened'> & AllMiddlewareArgs) {
    // Don't update when the messages tab is opened
    if (body.event.tab == 'home') {
        publishDefaultHomeView(event.user, client)
    }
}

export async function publishDefaultHomeView(user: string, client: WebClient) {
    if (user == slack_admin_id) {
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

