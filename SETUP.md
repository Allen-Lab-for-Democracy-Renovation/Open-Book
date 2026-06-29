# OpenBook Setup Guide

OpenBook is a municipal budget transparency portal. Each town deploys its own instance with a Postgres database.

## Prerequisites

- Node.js 20 LTS or later
- npm 9+
- A Postgres database connection string

For testing, a free Postgres database from Vercel Storage, Neon, or Supabase is enough.

## Local Setup

```bash
git clone https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book.git
cd Open-Book
npm install
cp .env.example .env.local
```

Edit `.env.local` and set `DATABASE_URL` to your Postgres connection string. If your provider gives you both pooled and direct URLs, set `DATABASE_URL` to the pooled runtime URL and `DIRECT_URL` to the direct URL.

```bash
npm run dev
```

Visit `http://localhost:3000/admin/register` to create the first admin account. The first account becomes the admin; after that, registration is locked unless an admin is logged in.

## Vercel Deployment

1. Fork this repository to the town's GitHub account.
2. Create a Postgres database through Vercel Storage, Neon, or Supabase.
3. In Vercel, click **Add New Project** and import the forked repository.
4. Add environment variables:

| Variable       | Required | Description                                                                 |
| -------------- | -------- | --------------------------------------------------------------------------- |
| `DATABASE_URL` | Yes      | Postgres connection string used by the running app                          |
| `DIRECT_URL`   | No       | Direct Postgres connection string for migrations when using pooled databases |

5. Click **Deploy**.
6. Visit `https://your-vercel-url/admin/register` and create the first admin account.

No manual database-provider migration or Prisma schema edit is required.

## Custom Domain

For municipal deployments, use a `.gov` subdomain such as `budget.yourtown.gov`.

1. Add the domain in Vercel under **Settings > Domains**.
2. Create the DNS record Vercel shows, usually a CNAME pointing to `cname.vercel-dns.com`.
3. Wait for DNS propagation. Vercel provisions HTTPS automatically.

If a website vendor manages the town site, ask them to create the CNAME record.

## Seeding Sample Data

To load sample data for testing:

```bash
npm run seed
```

This loads the sample CSV files from `sample-data/` into the configured Postgres database.

## Troubleshooting

**Admin registration fails or shows a server error**: confirm `DATABASE_URL` is set in Vercel for the current environment, redeploy, and check the Vercel build/runtime logs for migration errors.

**Migration errors with Neon or Supabase**: add `DIRECT_URL` using the provider's direct connection string, then redeploy.

**Port conflicts locally**: use `npm run dev -- --port 3001` to run on a different port.
