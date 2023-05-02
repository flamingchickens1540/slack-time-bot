/* eslint-disable @typescript-eslint/no-empty-function */
import { LogLevel, Logger } from "@slack/logger";

export const logger:Logger = {
    debug: (...msgs) => {},
    info: (...msgs) => {},
    warn: (...msgs:string[]) => { 
        msgs.forEach((value) => {
            if (value.toLowerCase().includes("rate limit")) {
                return;
            }
        })
        console.warn(msgs)
    },
    error: console.error,
    setLevel: () => { },
    getLevel: () => {return LogLevel.WARN },
    setName: () => { },
}