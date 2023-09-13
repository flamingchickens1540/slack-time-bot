import type { SlackCommandMiddlewareArgs, AllMiddlewareArgs } from "@slack/bolt";
import { getLoggedIn } from "../utils/drive";

export async function handleGetLoggedInCommand({ logger, ack, respond }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    try {
        const users = await getLoggedIn()
        await respond({response_type:"ephemeral", text: users.length > 0 ? `*Currently Logged In:*\n${users.join("\n")}`: "Nobody is logged in", mrkdwn:true})
    } catch (e) {
        logger.error(e)
        await respond({response_type:"ephemeral", text: `Could not get logged in users: ${e}`})
        return
    }
}