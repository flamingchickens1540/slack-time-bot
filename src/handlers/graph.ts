import type { AllMiddlewareArgs, SlackCommandMiddlewareArgs, KnownBlock } from "@slack/bolt";
import { formatNames } from "../messages";
import { createChart } from "../utils/chart";


export async function handleGraphCommand({ command, logger, ack, respond, client }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
    await ack({ response_type: 'ephemeral', text: 'Generating...' })

    const args = command.text.split(" ").filter(x => x.trim() != '')
    let users: string[] = []
    if (args.length == 0) {
        const user = await client.users.info({ user: command.user_id })
        users = [user.user!.real_name!]
    } else if (args[0] == 'all') {
        await respond({ text: "Hours graph", blocks: getGraphBlocks("https://docs.google.com/spreadsheets/d/e/2PACX-1vSHrWf9EtoNjuaGFuBy0IsnMQ5zDS1YLWCDwwyb0df0bjAf-13Nqt3z8bt7b3YA1_NhfHn6J2TjyLyl/pubchart?oid=1533918925&format=image", command.user_id, ["all"]), response_type: 'in_channel' })
        return;
    } else {
        // Collect all user names from mentions
        await Promise.all(args.map(async arg => {
            
            try {
                // strip mention characters from user id
                const user_id = arg.match(/<@([\w\d]+)\|.+>/)![1]
                const user = await client.users.info({ user: user_id })
                if (user.ok && typeof (user.user!.real_name) !== 'undefined') {
                    users.push(user.user!.real_name)
                }
            } catch (e) {
                logger.warn(`Could not find user ${arg}`, e)
                await respond({ response_type: 'ephemeral', text: `Could not find user ${arg}` })
            }
        }))
    }
    if (users.length == 0) {
        await respond({ replace_original: true, response_type: 'ephemeral', text: 'No users specified' })
        return
    }
    const image_url = await createChart(users)
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