import type { SlackCommandMiddlewareArgs, AllMiddlewareArgs } from "@slack/bolt";
import { voidHours } from "../utils/drive";
import { WebClient } from "@slack/web-api";
import { slack_voider_channel } from "../../secrets/consts";


async function isVoider(client:WebClient, user_id:string) {
    const conversations = await client.conversations.members({channel:slack_voider_channel})
    if (!conversations.ok) {
        console.warn(conversations.error)
        return {
            ok:false,
            isVoider: null
        }
    }
    return {
        ok: true,
        isVoider: conversations.members!.some((member) => member == user_id) 
    }
}

export async function handleVoidCommand({ command, logger, ack, respond, client }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    const invokerPermissions = await isVoider(client, command.user_id)
    if (!invokerPermissions.ok) {
        await respond({response_type:"ephemeral", text:"Something went wrong!"})
        return
    }
    if (!invokerPermissions.isVoider) {
        await respond({response_type:"ephemeral", text: "Must be a copresident to run this command"})
        return
    }

    try {
        const target_match = command.text.match(/<@([\w\d]+)\|.+>/)
        if (target_match == null) {
            await respond({response_type:"ephemeral", text:`Please provide the user in the form of a mention (like <@${command.user_id}>)`})
            return
        }
        const target_id = target_match![1]
        const target = await client.users.info({user:target_id})

        if (!target.ok) {
            await respond({response_type:"ephemeral", text:`Could not find user <@${target_id}>`})
            return
        }
        const isTargetManager = await isVoider(client, target.user!.id!)
        if (isTargetManager.isVoider) {
            await respond({response_type: "ephemeral", text:"Cannot void hours for other voiders!"})
            return
        }
        const name = target.user!.real_name!
        const status = await voidHours(name)
        switch (status) {
            case 200:
                await respond({response_type:"ephemeral", text: `Successfully voided hours for ${name}`})
                console.log(`${command.user_name} has voided hours for ${name}`)
                client.chat.postMessage({channel:slack_voider_channel, text:`<@${command.user_id}> has voided hours for <@${target_id}>`})
                break;
            case 422:
                await respond({response_type:"ephemeral", text: `${name} is not logged in`})
                break;
            default:
                await respond({response_type:"ephemeral", text: `Could not void hours for ${name}: ${status}`})
    }
    } catch (e) {
        logger.error(e)
        await respond({response_type:"ephemeral", text: `Could not parse arguments: ${e}`})
        return
    }
    // switch (status) {
    //     case 200:
    //         await respond({response_type:"ephemeral", text: `Successfully cleared login, you are no longer signed in`})
    //         break;
    //     case 422:
    //         await respond({response_type:"ephemeral", text: `You are not logged in`})
    //         break;
    //     default:
    //         await respond({response_type:"ephemeral", text: `Could not void hours: ${status}`})
    // }
    
}