import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from "@slack/bolt"
import { slack_admin_id } from "../../secrets/consts"
import type { ButtonActionMiddlewareArgs, Department } from "../types"
import { ensureSettingsExist, saveData } from "../utils/data"
import { getSettingsView } from "../views/settings"
import { publishDefaultHomeView } from "./app_home"


export async function handleOpenSettingsModal({ ack, client, body, logger }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    try {
        client.views.open({
            trigger_id: body.trigger_id,
            view: getSettingsView(body.user.id)
        })
    } catch (err) { logger.error("Failed to handle open settings modal:\n" + console.trace(err)) }
}

export async function handleSettingsSave({ack, view, body, client}:SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
    await ack()
    if (slackApproverIDs.includes(body.user.id) || body.user.id == slack_admin_id) {
        slackApproverIDs = view.state.values.approver_selector.selected_users.selected_users!
    }
    ensureSettingsExist(body.user.id)
    userSettings[body.user.id].department = view.state.values.department_selector.selected_department.selected_option!.value! as Department
    await saveData()
    await publishDefaultHomeView(body.user.id, client)
}