# src/Frontend — everything the visitor sees

UI code only: React components, page views, styles and browser-side helpers. Nothing in here talks to the database. Data comes in as props from a route file in `src/app`, or from `fetch("/api/...")` calls in client components.

| Folder | What's inside |
| --- | --- |
| `components/ui/` | Base building blocks (button, card, dialog, input, select, tabs, …) in the shadcn style. Reused everywhere. |
| `components/brand/` | Mentra branding: `MentraLogo`, `MentraMark`, and the marketing-site `HomepageHeader` / `HomepageFooter` used by the landing, community, find-mentor, privacy, terms and 404 pages. |
| `components/` (top level) | Small shared pieces: `MentorAvatar`, `ErrorBoundary` (wraps the whole app in `src/app/layout.tsx`), `HowItWorksSteps` (landing page). |
| `views/auth/` | Sign-in and sign-up screens: `signin-view.tsx`, `signup-view.tsx`, the split-screen `auth-shell.tsx`, `already-authenticated-view.tsx`, the admin sign-in (`admin-signin-view.tsx`, `admin-auth-shell.tsx`) and `search-params.ts` (reads `?callbackUrl=` etc.). |
| `views/onboarding/` | The step-by-step wizards new users fill in: `student-onboarding-wizard.tsx`, `mentor-onboarding-wizard.tsx`. |
| `views/dashboard/student/` | Student dashboard frame (`student-shell.tsx`: sidebar + top bar) and display helpers (`student-dashboard-utils.ts`). The student pages themselves are client components in `src/app/dashboard/student/`. |
| `views/dashboard/mentor/` | Mentor dashboard frame (`mentor-shell.tsx`) and one `*-page-client.tsx` per tab: availability, earnings, profile, reviews, sessions. |
| `views/dashboard/` | `dashboard-account-panel.tsx`, the signed-in account panel shown in the onboarding wizards. |
| `views/mentor/` | Public mentor profile and booking flow: `public-mentor-booking-card.tsx`, `mentor-booking-page-client.tsx` (date/slot picker + Razorpay checkout), `mentor-booking-shared.ts`. |
| `views/session/` | The live video session room: `SessionRoomPageClient.tsx`. |
| `views/admin/` | Admin panel: `admin-shell.tsx` (sidebar + top bar), one `*-client.tsx` per admin page, `admin-ui.tsx` (shared admin widgets), `admin-data-table.tsx` (sortable table + CSV export), `admin-status-badge.tsx`, `admin-utils.ts` (formatting). |
| `views/profile/` | `profile-sign-out-button.tsx` for the `/profile` page. |
| `lib/` | Browser-side helpers: `utils.ts` (`cn()` for merging Tailwind classes), `react-query.ts` (React Query defaults), `uploadthing.ts` (file-upload client). |
| `styles/globals.css` | Global Tailwind styles, theme colours and dark mode. |

## How a page is wired

```
src/app/<route>/page.tsx        (server: loads data, checks the session)
   └─ src/Frontend/views/<feature>/<name>-client.tsx   (client: renders and handles clicks)
         └─ src/Frontend/components/...                (shared UI pieces)
```

Some pages (the landing page, community, find-mentor, privacy, terms, profile, the student dashboard tabs) keep their UI directly in the `src/app/.../page.tsx` file instead of a view. See the feature map in the root [README](../../README.md#project-structure).

## Imports from outside this folder

- `@/shared/...`: constants, labels and helpers that both the UI and the server use. They're safe to import here.
- `@/Backend/...`: `import type` only (for example `MentorDashboardData`). Never import a database or auth module into a client component.
