import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from "@slack/bolt"
import { slack_admin_id } from "../../secrets/consts"
import type { ButtonActionMiddlewareArgs, Department } from "../types"
import { ensureSettingsExist, saveData, data } from "../utils/data"
import { departmentTitles, getSettingsView } from "../views/settings"
import { publishDefaultHomeView } from "./app_home"
import { setDepartment } from "../utils/profile"


export async function handleOpenSettingsModal({ ack, client, body, logger }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
    await ensureSettingsExist(body.user.id)
    await ack()
    try {
        client.views.open({
            trigger_id: body.trigger_id,
            view: await getSettingsView(body.user.id)
        })
    } catch (err) { logger.error("Failed to handle open settings modal:\n" + console.trace(err)) }
}

export async function handleSettingsSave({ack, view, body, client}:SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
    await ack()
    if (data.slackApproverIDs.includes(body.user.id) || body.user.id == slack_admin_id) {
        data.slackApproverIDs = view.state.values.approver_selector.selected_users.selected_users!
    }
    await ensureSettingsExist(body.user.id)
    data.userSettings[body.user.id].department = view.state.values.department_selector.selected_department.selected_option!.value! as Department
    await setDepartment(body.user.id, departmentTitles[data.userSettings[body.user.id].department??""] ?? "")
    await saveData()
    await publishDefaultHomeView(body.user.id, client)
}