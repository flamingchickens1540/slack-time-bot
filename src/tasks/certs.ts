import type { WebClient } from "@slack/web-api";
import { slack_celebration_channel } from "../../secrets/consts";
import { Certification, Member } from "../types";
import { certs, saveData } from "../utils/data";
import { getMembers } from "../utils/drive";


export async function celebrateMembers(client: WebClient) {
    const slackMembers = (await client.users.list()).members
    const members = await getMembers() as Member[]
    const promises = members.map(async (member) => {
        const cachedCerts = (certs[member.name] ?? []).map((cert) => cert.id)
        const newCerts: Certification[] = []
        member.certs.forEach((cert) => {
            if (!cachedCerts.includes(cert.id)) {
                newCerts.push(cert)
            }
        })
        if (newCerts.length > 0) {
            const user = slackMembers?.find((slack_member) => slack_member.real_name == member.name)
            const userText = (user == null) ? member.name : `<@${user.id}>`;
            newCerts.forEach(async (cert) => {
                await client.chat.postMessage({ channel: slack_celebration_channel, text: `${userText} just got a ${cert.name} certification` })
            })
        }
        certs[member.name] = member.certs
        await saveData()
    })
    await Promise.all(promises)
    
}