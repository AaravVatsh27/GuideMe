export const PLATFORM_NAME = "GuideMe";
export const PLATFORM_CUT = 0.2;
// Prices are in paise (see shared/money.ts).
export const MIN_PRICE_PAISE = 9900;
export const MAX_PRICE_PAISE = 59900;
export const MAX_45_MIN_PRICE_PAISE = 99900;
export const FREE_INTRO_DURATION = 10;
export const SESSION_DURATIONS = [30, 45] as const;
export const DEFAULT_CURRENCY = "INR";
export const DEFAULT_TIMEZONE = "Asia/Kolkata";
export const SESSION_JOIN_EARLY_WINDOW_MINUTES = 5;
// A student can report a mentor no-show once this many minutes have passed since the start time...
export const NO_SHOW_REPORT_GRACE_MINUTES = 10;
// ...and until this many hours after the scheduled end.
export const NO_SHOW_REPORT_WINDOW_HOURS = 24;
// Meeting tokens stay valid this long after the scheduled end.
export const SESSION_ROOM_GRACE_MINUTES = 60;
// An unpaid paid booking holds its slot for this long; after that the slot is free again.
export const UNPAID_BOOKING_HOLD_MINUTES = 15;
// How many unpaid paid bookings a student may hold at once.
export const MAX_UNPAID_BOOKING_HOLDS = 2;
