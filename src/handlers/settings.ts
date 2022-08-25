import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from "@slack/bolt"
import type { ButtonActionMiddlewareArgs } from "../types"
import { saveData } from "../utils/data"
import { getSettingsView } from "../views/settings"


export async function handleOpenSettingsModal({ ack, client, body, logger }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    try {
        client.views.open({
            trigger_id: body.trigger_id,
            view: getSettingsView()
        })
    } catch (err) { logger.error("Failed to handle open settings modal:\n" + err) }
}

export async function handleSettingsSave({ack, view}:SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
    await ack()
    
    slackApproverIDs = view.state.values.approver_selector.selected_users.selected_users!
    await saveData()
}