import type { SlackActionMiddlewareArgs, BlockAction, ButtonAction, StaticSelectAction } from "@slack/bolt";

export type ButtonActionMiddlewareArgs = SlackActionMiddlewareArgs<BlockAction<ButtonAction>>;
export type StaticSelectActionMiddlewareArgs = SlackActionMiddlewareArgs<BlockAction<StaticSelectAction>>;

export type LeaderboardType = "total" | "weekly" | "lab" | "external" | "department"
export type Department = "fab" | "controls" | "robotsw" | "appsw" | "community" | "companal" | "outreach"
export type TimeRequest = {
    name: string;
    time: number;
    userId: string;
    activity: string;
    requestMessages: {
        [key: string]: {
            channel: string;
            ts: string;
        };
    };
};

export type LogRow = {
    time_in: Date,
    time_out: Date,
    name: string,
    hours: number,
    type: "lab" | "external"
}

export type UserSettings = {
    leaderboard_type: LeaderboardType,
    department?: Department,
    real_name: string,
}