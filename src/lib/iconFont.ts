/**
 * The app's Material Symbols icons, cut down to the names the code uses
 * (about 75 KB instead of 1.1 MB). Icon names typed into /admin may fall
 * outside this list; IconFont then loads the full font on that page.
 * src/__tests__/icon-font.test.ts fails when code uses a name missing here.
 */
export const ICON_NAMES = [
  "ac_unit", "accessible", "accessible_forward", "account_balance", "add", "add_a_photo", "alt_route",
  "analytics", "architecture", "arrow_back", "arrow_downward", "arrow_forward", "arrow_upward", "article",
  "attribution", "auto_awesome", "auto_stories", "autorenew", "badge", "bar_chart", "bed", "block", "bolt",
  "broken_image", "calendar_month", "calendar_today", "call", "camera_roll", "campaign", "camping", "candle",
  "card_giftcard", "castle", "category", "check", "check_circle", "chevron_right", "circle", "close", "cloud",
  "cloud_sync", "coffee", "compare", "conditions", "content_copy", "cottage", "create", "cruelty_free",
  "dark_mode", "dashboard", "delete", "delete_forever", "description", "diamond", "directions_walk", "distance",
  "diversity_3", "download", "dry", "east", "eco", "edit", "edit_location_alt", "edit_note", "elevation",
  "email", "emergency", "emoji_events", "error", "expand_less", "expand_more", "explore", "festival",
  "filter_vintage", "flag", "flood", "footprint", "forest", "grain", "graphic_eq", "grass", "group", "groups",
  "handshake", "headphones", "help", "hiking", "history", "home", "hotel", "info", "key", "landscape",
  "language", "laps", "layers", "leaderboard", "lightbulb", "link", "local_cafe", "local_fire_department",
  "local_florist", "local_hospital", "local_pharmacy", "location_city", "location_on", "lock", "lock_open",
  "logout", "loyalty", "mail", "map", "medical_services", "menu", "menu_book", "military_tech", "museum",
  "my_location", "nature", "navigation", "near_me", "news", "nfc", "north", "notifications_active",
  "open_in_new", "overview", "park", "partly_cloudy_day", "password", "pause", "person", "person_add",
  "person_remove", "pets", "photo_camera", "photo_library", "picture_as_pdf", "pin_drop", "place", "play_arrow",
  "privacy", "progress_activity", "public", "public_off", "push_pin", "qr_code_2", "qr_code_scanner", "rainy",
  "redeem", "remove", "report", "restaurant", "route", "satellite", "satellite_alt", "save", "scan", "schedule",
  "search", "search_off", "sell", "settings", "share", "share_location", "shield", "shop", "shopping_bag",
  "signal_cellular_alt", "source", "south", "spa", "sports_bar", "star", "start", "steps", "storefront",
  "swap_horiz", "tag", "terrain", "text_to_speech", "theater_comedy", "thunderstorm", "timeline", "timer",
  "tips_and_updates", "title", "track_changes", "travel_explore", "trending_up", "upload", "uppercase",
  "verified", "visibility", "visibility_off", "volume_up", "volunteer_activism", "wallet", "warning", "water",
  "water_drop", "wb_sunny", "wb_twilight", "wc", "weather_snowy", "west", "whatshot", "workspace_premium",
  "wrong_location",
] as const;

const FAMILY = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1";

/** Google needs the names sorted alphabetically. */
export const ICON_FONT_SUBSET = `${FAMILY}&icon_names=${[...ICON_NAMES].sort().join(",")}&display=swap`;
export const ICON_FONT_FULL = `${FAMILY}&display=swap`;
