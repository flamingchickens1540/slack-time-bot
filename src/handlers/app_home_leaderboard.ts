import { AllMiddlewareArgs } from "@slack/bolt"
import { saveData } from ".."
import { LeaderboardType, StaticSelectActionMiddlewareArgs } from "../consts"
import { publishDefaultHomeView } from "./app_home"

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