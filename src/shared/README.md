# src/shared — code used by both the UI and the server

Pure constants and helper functions with no database access, no secrets and no React. Both `src/Frontend` and `src/Backend` (and route files in `src/app`) can import them through `@/shared/...`.

| File | What it holds |
| --- | --- |
| `constants.ts` | Platform-wide numbers: platform cut, min/max session price, session lengths, timezone, join and no-show windows, booking hold limits. |
| `auth-flow.ts` | Sign-in/sign-up flow helpers: default redirect, safe `callbackUrl` check, which onboarding page a role goes to, error-message copy. |
| `mentor-onboarding.ts` | Mentor onboarding options and labels (exams, degrees, years, help topics, availability days) plus related types. |
| `student-onboarding.ts` | Student onboarding options and labels (class, board, stream, languages, state, mentorship needs, decision stage) plus related types. |
| `mentor-dashboard-utils.ts` | Formatting helpers for the mentor dashboard (currency, dates, initials, slot keys, trends). Used by the server loader and the dashboard UI. |
| `money.ts` | The money convention: every amount (database, API, UI state) is an integer number of **paise**. `rupeesToPaise` / `paiseToRupees` convert only where people type or read rupees (price pickers, CSV exports, search URL filters). |
| `format.ts` | `formatPaise` (149900 → "₹1,499", 9950 → "₹99.50") and `getInitials`, used everywhere amounts and avatars are shown. |
| `roles.ts` | The user roles (`STUDENT`, `MENTOR`, `ADMIN`) and the `isAuthRole` check. |
| `validations/url.ts` | Safe-URL checks (`isSafeHttpsUrl`, LinkedIn and image URL schemas). |

Other shared folders: `src/types/` (TypeScript types, including the next-auth session type) and `src/constants/` (college-verification limits).
