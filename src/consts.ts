import type { SlackActionMiddlewareArgs, BlockAction, ButtonAction } from "@slack/bolt";

export const json_data_path = 'data.json'
export const slack_approver_id = "U03V72L4K4H"
export const log_sheet_name = "Log"
export const hours_sheet_id = '1KxS5gqUhygWnLlga9wM2k6jfJr5tCKCxycN3axkWnCA'


export type ButtonActionMiddlewareArgs = SlackActionMiddlewareArgs<BlockAction<ButtonAction>>;

export interface TimeRequest {
    name: string,
    time: number,
    userId: string,
    activity: string,
    requestMessage: {
        channel: string,
        ts: string,
        text:string,
        blocks: any[]
    }
}
