# src/app — routes (Next.js App Router)

Folder names here are the website's URLs, so files in this folder can't move without changing the URL. Each `page.tsx` is one page and each `api/**/route.ts` is one HTTP endpoint. Most route files are thin: they check the session, load data from `src/Backend`, and render a view from `src/Frontend/views`.

## App-wide files

| File | What it does |
| --- | --- |
| `layout.tsx` | Root HTML layout, fonts, metadata, wraps every page in `providers.tsx` and the error boundary. |
| `providers.tsx` | Client providers: auth session, React Query, theme (light/dark), tooltips, toasts. |
| `error.tsx`, `global-error.tsx`, `not-found.tsx` | Error and 404 pages. |
| `icon.png`, `apple-icon.png`, `favicon.ico`, `fonts/` | Site icons and the Geist font files. |

## Pages

| URL | File | Notes |
| --- | --- | --- |
| `/` | `page.tsx` | Mentra landing page. The full page is written inline here; data comes from `Backend/server/public-data.ts`. |
| `/auth/signin`, `/auth/signup` | `auth/signin/page.tsx`, `auth/signup/page.tsx` | Render `Frontend/views/auth/signin-view.tsx` / `signup-view.tsx` inside `auth-shell.tsx`. |
| `/auth/verify`, `/auth/error` | `auth/verify/page.tsx`, `auth/error/page.tsx` | "Check your email" and sign-in error screens. |
| `/dashboard` | `dashboard/page.tsx` | Redirects to the right dashboard or onboarding page based on role. |
| `/dashboard/student/**` | `dashboard/student/` | Student home, find-mentor, saved mentors, sessions, profile. These pages are client components that call `/api/student/*`, `/api/sessions`, `/api/matching`. Frame: `layout.tsx` → `student-shell.tsx`. |
| `/dashboard/mentor/**` | `dashboard/mentor/` | Mentor home, availability, earnings, profile, reviews, sessions. Each loads `getMentorDashboardData()` and renders a `*-page-client.tsx`. Frame: `layout.tsx` → `mentor-shell.tsx`. |
| `/onboarding/student`, `/onboarding/mentor` | `onboarding/*/page.tsx` | First-time setup wizards. |
| `/find-mentor` | `find-mentor/page.tsx` | Public mentor directory (inline page). |
| `/mentor/[username]`, `/mentor/[username]/book` | `mentor/[username]/` | Public mentor profile and the booking + payment flow. |
| `/session/[sessionId]` | `session/[sessionId]/page.tsx` | Live video session room (`Frontend/views/session/SessionRoomPageClient.tsx`). |
| `/profile` | `profile/page.tsx` | Signed-in user's account page (inline). |
| `/community` | `community/page.tsx` | Community page (inline). |
| `/privacy`, `/terms` | `privacy/page.tsx`, `terms/page.tsx` | Legal pages. `/privacy-policy` and `/terms-of-service` show the same pages. |
| `/admin/**` | `admin/` | Admin panel. `admin/layout.tsx` blocks anyone who isn't an admin; `/admin/signin` is the admin login. |

## API endpoints (`api/`)

| Path | Purpose |
| --- | --- |
| `api/auth/[...nextauth]`, `api/auth/complete-signup` | Auth.js sign-in/sign-out handlers; saving the chosen role after sign-up. |
| `api/onboarding/student`, `api/onboarding/mentor` | Save onboarding answers. |
| `api/student/*` | Student dashboard data, profile, saved mentors. |
| `api/mentors/*` | Mentor directory, a mentor's public profile, availability and reviews; the signed-in mentor's own profile. |
| `api/matching`, `api/matching/refresh` | Student → mentor match suggestions. |
| `api/sessions/*` | Book, list, cancel and complete sessions, session notes, Daily video tokens. |
| `api/payment/*`, `api/payouts/*` | Razorpay orders, payment verification and refunds; mentor payouts. |
| `api/reviews/*` | Post and flag reviews. |
| `api/admin/*` | Admin actions: verify mentors, bulk mentor updates, session actions. |
| `api/v1/verification/email/*`, `api/v1/institutions/*` | College email OTP verification and institution search. |
| `api/webhooks/razorpay`, `api/webhooks/daily` | Incoming webhooks from Razorpay and Daily. |
| `api/uploadthing` | File uploads (`core.ts` defines what can be uploaded). |
| `api/public/landing`, `api/og`, `api/email-preview/[template]` | Landing-page data, social share images, email template previews. |
