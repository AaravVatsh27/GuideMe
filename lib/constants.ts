export const PLATFORM_NAME = "GuideMe";
export const PLATFORM_CUT = 0.2;
export const MIN_PRICE = 99;
export const MAX_PRICE = 599;
export const FREE_INTRO_DURATION = 10;
export const SESSION_DURATIONS = [30, 45] as const;
export const DEFAULT_CURRENCY = "INR";
export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export const MONEY_LOCALE = "en-IN";

export const SHORT_SESSION_DURATION = SESSION_DURATIONS[0];
export const LONG_SESSION_DURATION = SESSION_DURATIONS[1];

const HOUR_IN_MS = 60 * 60 * 1000;

export const CANCELLATION_FULL_REFUND_HOURS = 24;
export const CANCELLATION_PARTIAL_REFUND_HOURS = 12;
export const CANCELLATION_PARTIAL_REFUND_PERCENT = 50;
export const CANCELLATION_NO_REFUND_PERCENT = 0;
export const CANCELLATION_FULL_REFUND_PERCENT = 100;
export const CANCELLATION_HOUR_IN_MS = HOUR_IN_MS;

export const SESSION_CONFLICT_LOOKBACK_MINUTES = 180;

export const DAILY_ROOM_BUFFER_MINUTES = 60;
export const DAILY_ROOM_NAME_PREFIX = "guideme-";
export const DAILY_ROOM_NAME_MAX_LENGTH = 24;

export const SESSION_RECEIPT_PREFIX = "gm-";
export const SESSION_RECEIPT_MAX_LENGTH = 18;

export const RECENT_MESSAGES_LIMIT = 20;
export const SUMMARY_NOTE_LINES_LIMIT = 8;
export const SUMMARY_MESSAGE_LINES_LIMIT = 12;

export const AI_SUMMARY_MAX_TOKENS = 320;
export const AI_SUMMARY_HIGHLIGHTS_LIMIT = 4;

export const DEFAULT_APP_URL = "http://localhost:3000";

export const REVIEW_LINK_QUERY = "?review=1";
