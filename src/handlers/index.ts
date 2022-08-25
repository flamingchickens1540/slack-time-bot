import type { App } from "@slack/bolt";
import { handleAcceptButton } from "./accept";
import { handleLeaderboardAction, handleAppHomeOpened } from "./app_home";
import { handleGraphCommand } from "./graph";
import { handleLogCommand, handleLogModal, handleLogShortcut } from "./log";
import { handleRejectButton, handleRejectModal } from "./reject";
import { handleOpenSettingsModal, handleSettingsSave } from "./settings";

export function register_listeners(app:App) {
	// Commands and Shortcuts
	app.command('/log', handleLogCommand)
	app.command('/graph', handleGraphCommand)
	app.shortcut('log_hours', handleLogShortcut)

	// Buttons
	app.action("accept", handleAcceptButton)
	app.action("reject", handleRejectButton)
	app.action("open_settings_modal", handleOpenSettingsModal)
	app.action("jump_url", async ({ ack }) => { await ack() })
	
	// Inputs
	app.action("selected_metric", handleLeaderboardAction)
	
	// Modals
	app.view("reject_message", handleRejectModal)
	app.view("time_submission", handleLogModal)
	app.view("save_settings", handleSettingsSave)

	// Events
	app.event('app_home_opened', handleAppHomeOpened)

}

