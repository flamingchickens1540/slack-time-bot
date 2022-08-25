import type { KnownBlock, ModalView } from "@slack/bolt";


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

export const getSettingsView = (): ModalView => {
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
        blocks: getSettingsViewBlocks()
    }
}
export const getSettingsViewBlocks = (): KnownBlock[] => {
    return [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "External Hour Approvers",
                emoji: true
            },
        },
        {
            block_id: "approver_selector",
            type: "section",
            fields: [{
                type: "plain_text",
                text: " ",
                emoji: true
            }],
            accessory: {
                type: "multi_users_select",
                placeholder: {
                    type: "plain_text",
                    text: "Select users",
                    emoji: true
                },
                initial_users: slackApproverIDs,
                action_id: "selected_users"
            }
        },
    ]

};

