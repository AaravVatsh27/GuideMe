# Mentra

Mentra (the GuideMe codebase) is a mentoring platform that connects students with senior mentors for 1:1 video sessions. It is built with Next.js 14 (App Router), Tailwind CSS v4, Prisma on Supabase Postgres, Auth.js, Razorpay, Resend and Daily.

## Environment Setup

Create `.env.local` from `.env.example` and set the database URLs for Supabase:

- `DATABASE_URL` is the Prisma runtime connection and should use the Supabase transaction pooler on port `6543` with `?pgbouncer=true`.
- `DIRECT_URL` is the Prisma CLI connection for migrations and introspection and should use the direct database host on port `5432`. If your machine is IPv4-only, Supabase session mode on port `5432` is a valid fallback.

The Prisma CLI config in [prisma.config.ts](prisma.config.ts) reads `DIRECT_URL` from `.env.local`, and the Prisma client in [src/Backend/server/db.ts](src/Backend/server/db.ts) uses `DATABASE_URL` at runtime.

For local admin access, set `MENTRA_ADMIN_PASSWORD` and `MENTRA_HR_PASSWORD` in `.env.local` (the email variables default to `admin@mentra.app` and `hr@mentra.app`), then run:

```bash
npx prisma migrate deploy
npx tsx prisma/seeds/seed.ts
```

The seed upserts both accounts with the `ADMIN` role and never stores plaintext passwords.

## Email

Mentra sends sign-in links and notifications through [Resend](https://resend.com). Email sign-in is turned on only when both `RESEND_API_KEY` and `EMAIL_FROM` are set.

Before launch:

1. Verify your sending domain in the Resend dashboard.
2. Set `EMAIL_FROM` to an address on that domain, such as `Mentra <hello@yourdomain.com>`, in `.env.local` and in the production environment.
3. Optionally set `EMAIL_REPLY_TO`; email footers show it as the support address.

Resend's test sender, `onboarding@resend.dev`, only delivers to the email on your own Resend account, so sign-in emails to anyone else will not arrive. The admin Settings page shows the current `EMAIL_FROM` value as "Support email".

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Pages live in `src/app`, and the page views live in `src/Frontend/views`.

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # Next.js lint
npx tsc --noEmit -p .   # type check
```

## Project Structure

```
src/
├── app/        Routes. Folder names are URLs: page.tsx = a page, api/**/route.ts = an endpoint
├── Frontend/   UI only: components, page views, styles, browser helpers
├── Backend/    Server only: database, auth, payments, email, video, validation
├── shared/     Constants and helpers used by both the UI and the server
├── types/      Shared TypeScript types (incl. the next-auth session type)
├── constants/  College-verification limits
└── middleware.ts   Redirects signed-out / not-yet-onboarded users
emails/         React Email templates (sent by src/Backend/server/resend.ts)
prisma/         Database schema, migrations and seed scripts
public/         Images served as-is (logos, avatars, hero art)
```

Each folder has its own README: [src/app](src/app/README.md), [src/Frontend](src/Frontend/README.md), [src/Backend](src/Backend/README.md), [src/shared](src/shared/README.md).

### Where each feature lives

| Feature | URL | Route file (`src/app`) | UI (`src/Frontend`) | Server code (`src/Backend`, `src/shared`) | API (`src/app/api`) |
| --- | --- | --- | --- | --- | --- |
| Landing page | `/` | `page.tsx` (whole page inline) | `components/brand/HomepageHeader`, `HomepageFooter`, `MentraLogo`; `components/HowItWorksSteps` | `server/public-data.ts` | `public/landing` |
| Sign in / sign up | `/auth/signin`, `/auth/signup`, `/auth/verify`, `/auth/error` | `auth/*/page.tsx` | `views/auth/` (`signin-view`, `signup-view`, `auth-shell`) | `auth.ts`, `server/auth.ts`, `server/auth-adapter.ts`, `server/auth-edge.ts`, `shared/auth-flow.ts` | `auth/[...nextauth]`, `auth/complete-signup` |
| Onboarding | `/onboarding/student`, `/onboarding/mentor` | `onboarding/*/page.tsx` | `views/onboarding/*-wizard.tsx` | `shared/student-onboarding.ts`, `shared/mentor-onboarding.ts` | `onboarding/*`, `uploadthing`, `v1/verification/*`, `v1/institutions/*` |
| Student dashboard | `/dashboard/student/**` | `dashboard/student/**` (client pages) | `views/dashboard/student/` | `server/matching.ts`, `server/sessions/` | `student/*`, `matching`, `sessions` |
| Mentor dashboard | `/dashboard/mentor/**` | `dashboard/mentor/**` | `views/dashboard/mentor/` | `server/mentor-dashboard-data.ts`, `shared/mentor-dashboard-utils.ts` | `mentors/profile`, `reviews/*`, `payouts` |
| Find a mentor and booking | `/find-mentor`, `/mentor/[username]`, `/mentor/[username]/book` | `find-mentor/`, `mentor/[username]/` | `views/mentor/` | `server/public-data.ts`, `server/sessions/`, `server/razorpay.ts` | `mentors/*`, `payment/*`, `webhooks/razorpay` |
| Session room | `/session/[sessionId]` | `session/[sessionId]/page.tsx` | `views/session/SessionRoomPageClient.tsx` | `server/sessions/`, `server/daily.ts` | `sessions/[sessionId]/*`, `webhooks/daily` |
| Admin panel | `/admin/**` | `admin/**` (`layout.tsx` checks admin access) | `views/admin/`, `views/auth/admin-signin-view.tsx` | `server/admin.ts` | `admin/*` |
| Profile, community, legal | `/profile`, `/community`, `/privacy`, `/terms` | `profile/`, `community/`, `privacy/`, `terms/` (inline pages) | `components/brand/`, `views/profile/` | — | — |
| Emails | — | — | — | `/emails`, `server/resend.ts` | `email-preview/[template]` |
| Shared UI kit | — | — | `components/ui/` (buttons, cards, dialogs, …), `lib/utils.ts` (`cn()`), `styles/globals.css` | — | — |

## Admin Panel

Sign in with a seeded admin account at `/admin/signin`, then open `/admin`. Every admin page checks the session in [src/app/admin/layout.tsx](src/app/admin/layout.tsx), and every admin data loader in [src/Backend/server/admin.ts](src/Backend/server/admin.ts) calls `requireAdminViewer()`.

| Route | What it shows |
| --- | --- |
| `/admin` | Platform overview: pending reviews, active mentors and total users, today's sessions and revenue, revenue for the last 30 days, alerts and recent sessions |
| `/admin/mentors/verification` | Verification queue: a carousel of pending applications, a table, and a details drawer to approve or reject. The open applicant is kept in `?id=` so a refresh keeps the drawer open |
| `/admin/users` | All accounts with search and a role filter |
| `/admin/mentors` | Mentors with tier and status filters and bulk verify, suspend and tier changes; click a row for `/admin/mentors/[id]` |
| `/admin/sessions` | Sessions with status and date filters; click a row to mark completed, refund or flag a no-show |
| `/admin/payments` | Collected, paid out and retained totals, the payout queue and all payments |
| `/admin/notifications` | Notifications sent to users, with read state |
| `/admin/settings` | System details and platform volume |

How the admin panel is put together:

- **Layout:** [admin-shell.tsx](src/Frontend/views/admin/admin-shell.tsx) draws the sidebar and top bar. The page views are the `*-client.tsx` files in [src/Frontend/views/admin](src/Frontend/views/admin).
- **Shared UI:** [admin-ui.tsx](src/Frontend/views/admin/admin-ui.tsx) holds the page header, pills, avatars, checkboxes, inputs and buttons, and [admin-data-table.tsx](src/Frontend/views/admin/admin-data-table.tsx) is the sortable, paginated table with CSV export.
- **Light only:** pages that render the admin shell (`data-admin-shell`) opt out of the system dark theme in [globals.css](src/Frontend/styles/globals.css). The rest of the site still follows the visitor's theme.
- **Live counts:** the overview numbers are queried on every load. Total users excludes deleted and admin accounts, and Active mentors counts verified, active mentors only.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Auth.js Documentation](https://authjs.dev)

## Deploy on Vercel

Deploy with the [Vercel Platform](https://vercel.com/new). Set the same environment variables as `.env.local` in the Vercel project, and run `npx prisma migrate deploy` against the production database before the first release.

## Scheduled Jobs

[vercel.json](vercel.json) runs three jobs through [src/app/api/cron/[job]/route.ts](src/app/api/cron/[job]/route.ts); the job code is in [src/Backend/server/jobs.ts](src/Backend/server/jobs.ts).

| Job | Schedule | What it does |
| --- | --- | --- |
| `session-reminders` | every 15 minutes | Emails and notifies both participants about an hour before a confirmed session. Each session is reminded once. |
| `expire-holds` | every 15 minutes | Cancels paid bookings that weren't paid within 15 minutes, freeing the slot. |
| `cleanup` | daily, 03:00 IST | Deletes expired sign-in tokens and read notifications older than 180 days. Audit logs are kept. |

Set `CRON_SECRET` in the Vercel project; Vercel sends it as `Authorization: Bearer <secret>` and the route rejects anything else. Running jobs more often than once a day needs a Vercel Pro plan; on Hobby, call the same URLs from an external scheduler with that header.
