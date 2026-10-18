# src/Backend — server-only code

Everything here runs on the server: database access, authentication, payments, email, video rooms, caching and input validation. Route files in `src/app` (pages and `src/app/api/**/route.ts`) import from here. UI components never do, apart from `import type`.

## Top level

| File | What it does |
| --- | --- |
| `auth.ts` | Creates the Auth.js (next-auth) instance and exports `auth()`, `signIn()`, `signOut()` and the route handlers. Call `auth()` to get the current session. |

## `server/`: core services

| File | What it does |
| --- | --- |
| `db.ts` | The Prisma client (database connection). |
| `auth.ts` | Auth.js configuration: providers (Google, email link, admin password), callbacks, session shape. |
| `auth-adapter.ts` | Custom Auth.js database adapter (`GuideMeAuthAdapter`). |
| `auth-edge.ts` | Slimmed-down auth config that can run in `src/middleware.ts` (edge runtime). |
| `admin.ts` | Every admin-panel data loader. Each one calls `requireAdminViewer()` first. |
| `mentor-dashboard-data.ts` | `getMentorDashboardData()`: loads everything the mentor dashboard tabs show. |
| `public-data.ts` | Data for public pages: platform stats, mentor directory, review highlights, auth-screen content. |
| `sessions.ts` | Booking and session logic: creating bookings, slot holds, session queries. |
| `matching.ts` | Student → mentor matching scores, with cache invalidation. |
| `daily.ts` | Daily.co video rooms and meeting tokens for the session room. |
| `razorpay.ts` | Razorpay payments: orders, signature checks, refunds. |
| `resend.ts` | Sends emails through Resend using the templates in `/emails`. |
| `openai.ts` | AI-generated post-session summaries. |
| `redis.ts` | Upstash Redis client used by the student and mentor profile API routes. |

## `lib/`: small server utilities

`api-helpers.ts` (JSON responses, error handling, rate-limit wrapper for API routes), `require-auth.ts`, `ratelimit.ts` (named rate limiters), `cache.ts` + `redis.ts` (Redis cache helpers), `otp.ts` + `hash.ts` (one-time codes), `sanitize.ts` (cleaning user text), `client-ip.ts`, `institution.ts`, `logger.ts`.

## `services/` and `repositories/`: college email verification

The `/api/v1/verification/*` and `/api/v1/institutions/*` routes use these layers:

- `services/`: business rules: `college.service.ts` (is this a college email?), `otp.service.ts` (issue and check codes), `email.service.ts` (send the code), `verification.service.ts`.
- `repositories/`: database queries for colleges, mentors and verifications.

## `validations/`: request schemas (Zod)

One file per area: `auth.ts`, `mentor.ts`, `payment.ts`, `review.ts`, `session.ts`, `student.ts`. API routes parse incoming JSON with these.

## Related folders outside `src/Backend`

- `src/shared/`: constants and helpers the UI uses as well (see its README).
- `src/app/api/`: the HTTP endpoints. Each `route.ts` is a thin wrapper that calls into this folder.
- `src/middleware.ts`: redirects signed-out or not-yet-onboarded users.
- `src/app/api/uploadthing/core.ts`: the file-upload server (what may be uploaded, and by whom).
- `/emails`: React Email templates. `/prisma`: database schema, migrations and seed scripts.
