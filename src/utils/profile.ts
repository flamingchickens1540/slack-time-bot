import { WebClient } from "@slack/web-api";
import { user_token } from "../../secrets/slack_secrets";
import { slack_certs_profile_field_id, slack_department_profile_field_id } from "../../secrets/consts";

const profileApp = new WebClient(user_token)


export async function setDepartment(user:string, department:string):Promise<boolean> {
    console.log(`Setting department for ${user} to ${department}`)
    try {
        const resp = await profileApp.users.profile.set({
            user: user,
            name: slack_department_profile_field_id,
            value: department
        })
        if (!resp.ok) {
            console.error(resp)
        }
        return resp.ok
    } catch (e) {
        console.error(e)
        return false
    }
}

export async function setProfileCerts(user:string, certs:string[]):Promise<boolean> {
    try {
        const resp = await profileApp.users.profile.set({
            user: user,
            name: slack_certs_profile_field_id,
            value: certs.join(", ")
        })
        if (!resp.ok) {
            console.error(resp)
        }
        return resp.ok
    } catch (e) {
        console.error(e)
        return false
    }
}
