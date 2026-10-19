/**
 * Session domain: booking, lifecycle, payment recovery and participant views.
 * Import from "@/Backend/server/sessions"; the files in this folder are internal.
 */

export { sessionListInclude, sessionDetailsInclude, SessionApiError } from "./shared";
export type { SessionListRecord, SessionDetailsRecord } from "./shared";
export { getBookingHoldCutoff, isBookingHoldExpired } from "./rules";
export { slotHoldingSessionWhere } from "./slots";
export { createSessionBooking } from "./booking";
export { cancelSessionById, markSessionStarted, completeSessionById } from "./lifecycle";
export { expireUnpaidBooking, releaseBookingIfSlotLost, refundPaymentForClosedSession } from "./payment-recovery";
export { toSessionListView, toSessionView } from "./views";
