# Slack Time Bot

A Slack bot to log hours for Team 1540

## Setup

The bot requires three files in `./secrets/`
- `client_secret.json` - The google cloud credential json
- `slack_secrets.js` - A file exporting the constants `app_token`, `token`, and `signing_secret` for your slack bot
- `consts.js` - A file exporting the below constants. These aren't really secrets, but they are unique to every deployment 
  - `hours_sheet_id` the ID of the google sheet to use for reading and writing hours
  - `slack_admin_id` the ID of a slack user who will be able to access the settings page and add time reviewers.

The `npm run deploy` script expects `DEPLOY_HOST` and `DEPLOY_SCRIPT` environment variables. 
  - `DEPLOY_HOST` should be the address of your server, as a ssh target
  - `DEPLOY_SCRIPT` should be a command that will cause the server to run the updated code