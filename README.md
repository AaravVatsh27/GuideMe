This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

Create `.env.local` from `.env.example` and set the database URLs for Supabase:

- `DATABASE_URL` is the Prisma runtime connection and should use the Supabase transaction pooler on port `6543` with `?pgbouncer=true`.
- `DIRECT_URL` is the Prisma CLI connection for migrations and introspection and should use the direct database host on port `5432`. If your machine is IPv4-only, Supabase session mode on port `5432` is a valid fallback.

The Prisma CLI config in [prisma.config.ts](/C:/Users/vatsh/OneDrive/Desktop/GuideMe/prisma.config.ts:1) reads `DIRECT_URL` from `.env.local`, and the Prisma client in [lib/db.ts](/C:/Users/vatsh/OneDrive/Desktop/GuideMe/lib/db.ts:1) uses `DATABASE_URL` at runtime.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
