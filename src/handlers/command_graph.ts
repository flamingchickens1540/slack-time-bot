import type { SlackCommandMiddlewareArgs, SlackShortcutMiddlewareArgs } from "@slack/bolt";
import type { KnownBlock, WebClient } from "@slack/web-api";
import { PassThrough } from "stream";
import { formatNames } from ".";
import { createChart } from "../utils/chart";
import log_modal from "../views/log_view";


export async function handleGraphCommand({ command, ack, respond, client }: SlackCommandMiddlewareArgs & { client: WebClient }) {
    await ack({ response_type: 'ephemeral', text: 'Generating...' })

    let args = command.text.split(" ").filter(x => x.trim() != '')
    console.log(args)
    let users: string[] = []
    if (args.length == 0) {
        let user = await client.users.info({ user: command.user_id })
        users = [user.user!.real_name!]
    } else if (args[0] == 'all') {
        users = args
    } else {
        // Collect all user names from mentions
        await Promise.all(args.map(async arg => {
            // strip mention characters from user id
            let user_id = arg.match(/<@([\w\d]+)\|.+>/)![1]
            let user = await client.users.info({ user: user_id })
            if (user.ok && typeof (user.user!.real_name) !== 'undefined') {
                users.push(user.user!.real_name)
            }
        }))
    }

    let image_url = await createChart(users)
    await respond({ text: "Hours graph", blocks: getGraphBlocks(image_url, command.user_id, users), response_type: 'in_channel' })
}

const getGraphBlocks = (image_url: string, user_id:string, names:string[]): KnownBlock[] => {
    return [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `:chart_with_upwards_trend: <@${user_id}> generated a graph for ${formatNames(names)}`,
            }
        },
        {
            type: "image",
            image_url: image_url,
            alt_text: "hour graph"
        }
    ]
}