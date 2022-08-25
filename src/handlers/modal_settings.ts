import type { AllMiddlewareArgs, BlockAction, MultiUsersSelectAction, SlackActionMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from "@slack/bolt"
import { saveData } from ".."
import { ButtonActionMiddlewareArgs } from "../consts"
import { getSettingsView } from "../views/bot_settings_view"
import { publishDefaultHomeView } from "./app_home"


export async function handleOpenSettingsModal({ ack, client, body }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    try {
        client.views.open({
            trigger_id: body.trigger_id,
            view: getSettingsView()
        })
    } catch (err) { console.error("Failed to handle open settings modal:\n" + err) }
}

export async function handleSettingsSave({ack, body, view, client}:SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
    await ack()
    
    slackApproverIDs = view.state.values.approver_selector.selected_users.selected_users!
    await saveData()
}