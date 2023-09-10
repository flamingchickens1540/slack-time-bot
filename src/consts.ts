export const json_data_path = 'data/data.json'
export const certs_cache_data_path = 'data/certs.json'
export const log_sheet_name = "Log"

const max_bar_length = 9
export const leaderboard_config = {
    max_bar_length: max_bar_length,
    max_r: Math.ceil(max_bar_length/3),
    max_o: Math.round(max_bar_length/3),
    max_y: Math.floor(max_bar_length/3)
}