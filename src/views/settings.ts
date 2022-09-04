import type { InputBlock, KnownBlock, ModalView, PlainTextOption, StaticSelect } from "@slack/bolt";
import type { Department } from "../types";
import { slack_admin_id } from "../../secrets/consts";
import { getSettings, data } from "../utils/data";


export const settingsButton: KnownBlock = {
    type: "actions",
    elements: [
        {
            type: "button",
            text: {
                type: "plain_text",
                text: "Settings",
                emoji: true
            },
            action_id: "open_settings_modal",
        }
    ]
}

export const getSettingsView = (user_id): ModalView => {
    const blocks: KnownBlock[] = []

    if (data.slackApproverIDs.includes(user_id) || user_id == slack_admin_id) { blocks.push(...getSettingsBlocksApprovers()) }
    blocks.push(...getSettingsBlocksDepartment(user_id))

    return {
        type: "modal",
        callback_id: "save_settings",
        title: {
            type: "plain_text",
            text: "Settings",
            emoji: true
        },
        submit: {
            type: "plain_text",
            text: "Save",
            emoji: true
        },
        close: {
            type: "plain_text",
            text: "Cancel",
            emoji: true
        },
        blocks: blocks
    }
}
export const getSettingsBlocksApprovers = (): KnownBlock[] => {
    return [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "Settings",
                emoji: true
            },
        },
        {
            block_id: "approver_selector",
            type: "input",
            label: {
                type: "plain_text",
                text: "External Hour Approvers",
                emoji: true
            },
            element: {
                type: "multi_users_select",
                placeholder: {
                    type: "plain_text",
                    text: "Select users",
                    emoji: true
                },
                initial_users: data.slackApproverIDs,
                action_id: "selected_users"
            }
        },
    ]
};

export const getSettingsBlocksDepartment = (user_id: string): KnownBlock[] => {
    const settings = getSettings(user_id)
    const output: InputBlock = {
        type: "input",
        label: {
            type: "plain_text",
            text: "Select your primary department",
            emoji: true
        },
        block_id: "department_selector",
        element: {
            type: "static_select",
            placeholder: {
                type: "plain_text",
                text: "Select an item",
                emoji: true
            },
            options: Object.values(departmentOptions),
            action_id: "selected_department"
        }
    }
    if (settings.department != null) {
        (output.element as StaticSelect).initial_option = departmentOptions[settings.department]
    }
    return [output]
};


export const departmentTitles: { [key in Department]: string } = {
    fab: "Fabrication",
    controls: "Controls",
    robotsw: "Robot Software",
    community: "Community Engineering",
    companal: "Competetive Analysis",
    outreach: "Outreach"
}

const departmentOptions: { [key in Department]: PlainTextOption } = {
    fab: {
        text: {
            type: "plain_text",
            text: departmentTitles.fab,
            emoji: true
        },
        value: "fab"
    },
    controls: {
        text: {
            type: "plain_text",
            text: departmentTitles.controls,
            emoji: true
        },
        value: "controls"
    },
    robotsw: {
        text: {
            type: "plain_text",
            text: departmentTitles.robotsw,
            emoji: true
        },
        value: "robotsw"
    },
    community: {
        text: {
            type: "plain_text",
            text: departmentTitles.community,
            emoji: true
        },
        value: "community"
    },
    companal: {
        text: {
            type: "plain_text",
            text: departmentTitles.companal,
            emoji: true
        },
        value: "companal"
    },
    outreach: {
        text: {
            type: "plain_text",
            text: departmentTitles.outreach,
            emoji: true
        },
        value: "outreach"
    }
}

