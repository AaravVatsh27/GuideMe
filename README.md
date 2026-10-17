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
