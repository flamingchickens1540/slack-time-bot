import type { SlackCommandMiddlewareArgs, AllMiddlewareArgs } from "@slack/bolt";
import { voidHours } from "../utils/drive";
import { certs } from "../utils/data";
import { WebClient } from "@slack/web-api";
import { readFileSync } from 'fs';

async function isManager(client:WebClient, user_id:string) {
    const conversations = await client.conversations.members({channel:"C05R9UGJDM5"}) //TODO: Put in constants file
    if (!conversations.ok) {
        console.warn(conversations.error)
        return {
            ok:false,
            isManager: null
        }
    }
    return {
        ok: true,
        isManager: conversations.members!.some((member) => member == user_id) 
    }
}

export async function handleVoidCommand({ command, logger, ack, respond, client }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    const isInvokerManager = await isManager(client, command.user_id)
    if (!isInvokerManager.ok) {
        await respond({response_type:"ephemeral", text:"Something went wrong!"})
        return
    }
    if (!isInvokerManager.isManager) {
        await respond({response_type:"ephemeral", text: "Must be a manager to run this command"})
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
        const isTargetManager = await isManager(client, target.user!.id!)
        if (isTargetManager.isManager) {
            await respond({response_type: "ephemeral", text:"Cannot void hours for other managers!"})
            return
        }
        const name = target.user!.real_name!
        const status = await voidHours(name)
        switch (status) {
            case 200:
                await respond({response_type:"ephemeral", text: `Successfully voided hours for ${name}`})
                console.log(`${command.user_name} has voided hours for ${name}`)
                client.chat.postMessage({channel:target.user!.id!, text:"Your current time sheet session has been voided by a manager. You will need to sign in again when you resume work"})
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