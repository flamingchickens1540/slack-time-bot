import type { SlackCommandMiddlewareArgs, AllMiddlewareArgs } from "@slack/bolt";
import { voidHours } from "../utils/drive";

export async function handleLogoutCommand({ command, logger, ack, respond, client }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    const user = await client.users.info({user:command.user_id})
    if (user.user?.real_name) {
        let status:number
        try {
            status = await voidHours(user.user.real_name)
        } catch (e) {
            logger.error(e)
            await respond({response_type:"ephemeral", text: `Could not void hours: ${e}`})
            return
        }
        switch (status) {
            case 200:
                await respond({response_type:"ephemeral", text: `Successfully cleared your login, you are no longer signed in`})
                break;
            case 422:
                await respond({response_type:"ephemeral", text: `You are not logged in`})
                break;
            default:
                await respond({response_type:"ephemeral", text: `Could not void hours: ${status}`})
        }
        
    } else {
        await respond({response_type:"ephemeral", text: `Could not find your name`})
        logger.error(`Could not find user ${command.user_id}`, user)
    }
}