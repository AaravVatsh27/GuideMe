/**
 * Every amount in the app (database, API and UI state) is an integer number of paise,
 * the unit Razorpay uses. Convert only where people type or read rupees.
 */

export const PAISE_PER_RUPEE = 100;

/** Rupees a person typed or chose → paise. */
export function rupeesToPaise(rupees: number) {
  return Math.round(rupees * PAISE_PER_RUPEE);
}

/** Paise → rupees, for showing or editing a value in rupees. */
export function paiseToRupees(paise: number) {
  return paise / PAISE_PER_RUPEE;
}

/** Rounds a paise amount to whole rupees, for prices that should not show paise. */
export function roundToWholeRupees(paise: number) {
  return Math.round(paise / PAISE_PER_RUPEE) * PAISE_PER_RUPEE;
}
