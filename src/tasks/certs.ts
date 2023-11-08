import type { WebClient } from "@slack/web-api";
import { slack_celebration_channel } from "../../secrets/consts";
import { Certification, Member } from "../types";
import { certs, saveData } from "../utils/data";
import { getMembers, getSlackMembers } from "../utils/drive";
import { setProfileCerts } from "../utils/profile";

const congratsMessages = [
    "Hey! Congrats @ for you new {} Cert!",
    "Awww, @ just got a {} Cert... They hatch so fast [;",
    "@. {}. Well done.",
    "Bawk bawk, bawk bawk @ bawk {} bawk, bawk SKREEEEE",
    "Friends! @ has earned a {}. May we all feast and be merry. :shallow_pan_of_food: ",
    "Congrats to @ on getting a {} certification!",
    "@ just earned a {}. Did you know: Software is the bread and butter of robotics.",
]

export async function celebrateMembers(client: WebClient) {
    const slackMembers = await getSlackMembers();
    const members = await getMembers() as Member[]
    const promises = members.map(async (member) => {
        const cachedCerts = (certs[member.name] ?? []).map((cert) => cert.id)
        const newCerts: Certification[] = []
        member.certs.forEach((cert) => {
            if (!cachedCerts.includes(cert.id)) {
                newCerts.push(cert)
            }
        })
        certs[member.name] = member.certs
        const user = slackMembers?.find((slack_member) => slack_member.real_name == member.name)
        if (user == null) {
            console.log(`Could not find user ${member.name}`)
            return
        }

        if (newCerts.length > 0) {
            const certnames = member.certs.map((cert) => cert.name)
            console.log(`Setting certs for ${user.real_name?.padEnd(50, " ")} [${certnames.join(", ").length}]: ${certnames}`)
            await setProfileCerts(user!.id!, certnames)

            const userText = (user == null) ? member.name : `<@${user.id}>`;
            newCerts.forEach(async (cert) => {
                let message = congratsMessages[Math.floor(Math.random() * congratsMessages.length)]; // get random message
                message = message.replace('@', userText) // set user mention
                message = message.replace('{}', `*${cert.name}*`) // set cert name in *bold*

                await client.chat.postMessage({ channel: slack_celebration_channel, text: message })
            })
        }
    })
    await Promise.all(promises)
    await saveData()

}