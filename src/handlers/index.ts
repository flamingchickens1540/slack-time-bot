import type { App } from "@slack/bolt";
import { getAcceptButtonHandler, handleAcceptMessageButton, handleAcceptModal } from "./accept";
import { handleLeaderboardAction, handleAppHomeOpened } from "./app_home";
import { handleGraphCommand } from "./graph";
import { handleLogCommand, handleLogModal, handleLogShortcut } from "./log";
import { handleLogoutCommand } from "./logout";
import { handleRejectButton, handleRejectModal } from "./reject";
import { handleOpenSettingsModal, handleSettingsSave } from "./settings";
import { handleVoidCommand } from "./void";
import { handleGetLoggedInCommand } from "./loggedin";

export function register_listeners(app: App) {
	// Commands and Shortcuts
	app.command('/log', handleLogCommand)
	app.command('/graph', handleGraphCommand)
	app.command('/clearlogin', handleLogoutCommand)
	app.command("/voidtime", handleVoidCommand)
	app.command("/loggedin", handleGetLoggedInCommand)
	app.shortcut('log_hours', handleLogShortcut)

	// Buttons
	app.action("accept", getAcceptButtonHandler("regular"))
	app.action("accept_summer", getAcceptButtonHandler("summer"))
	app.action("accept_comp", getAcceptButtonHandler("competition"))
	app.action("accept_msg", handleAcceptMessageButton)
	app.action("reject", handleRejectButton)
	app.action("open_settings_modal", handleOpenSettingsModal)
	app.action("jump_url", async ({ ack }) => { await ack() })

	// Inputs
	app.action("selected_metric", handleLeaderboardAction)

	// Modals
	app.view("reject_modal", handleRejectModal)
	app.view("accept_modal", handleAcceptModal)
	app.view("time_submission", handleLogModal)
	app.view("save_settings", handleSettingsSave)

	// Events
	app.event('app_home_opened', handleAppHomeOpened)

}

