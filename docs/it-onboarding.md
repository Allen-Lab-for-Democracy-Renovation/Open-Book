# IT Onboarding Guide

This guide is for municipal IT staff responsible for deploying and maintaining OpenBook for their town.

## What OpenBook Does

OpenBook publishes town budget data in a resident-friendly portal. Town administrators upload CSV or Excel budget files through an admin dashboard; residents view charts, tables, documents, FAQs, and capital project information on the public site.

## System Overview

- **Application**: Node.js web app using Next.js
- **Database**: Postgres
- **Authentication**: Password-based with HTTP-only session cookies
- **Data**: Budget data is uploaded through the admin UI

## Recommended Hosting: Vercel + Postgres

Vercel is the simplest hosting path because it handles builds, HTTPS, and custom domains. OpenBook also needs a managed Postgres database. Vercel Storage, Neon, and Supabase all work for testing.

### Steps

1. Fork or clone the OpenBook repository to the town's GitHub account.
2. Create a Postgres database.
3. In Vercel, click **Add New Project** and import the GitHub repository.
4. Add the environment variables below.
5. Click **Deploy**.
6. Visit `/admin/register` on the deployed site and create the first admin account.

## Environment Variables

| Variable       | Required | Description                                                                 |
| -------------- | -------- | --------------------------------------------------------------------------- |
| `DATABASE_URL` | Yes      | Postgres connection string used by the running app                          |
| `DIRECT_URL`   | No       | Direct Postgres connection string for migrations when using pooled databases |

If your provider gives you both pooled and direct URLs, use the pooled URL for `DATABASE_URL` and the direct URL for `DIRECT_URL`. Prisma uses `DIRECT_URL` for migrations when it is present.

## Self-Hosted Server

If your town manages its own infrastructure, OpenBook runs on any server with Node.js 20+ and access to Postgres.

```bash
git clone <your-fork-url>
cd openbook
npm install
cp .env.example .env.local
# Edit .env.local with DATABASE_URL and, if needed, DIRECT_URL
npm run build
npm start
```

The application runs on port 3000 by default. Place it behind a reverse proxy such as nginx, Apache, or Caddy to serve HTTPS on port 443.

## Custom Domain Setup

Most towns will want OpenBook on a recognizable domain, such as `budget.townname.gov` or `openbook.townname.gov`.

### Vercel

1. In Vercel project settings, go to **Domains**.
2. Add the full domain, such as `budget.townname.gov`.
3. Create the DNS record Vercel shows, usually a CNAME pointing to `cname.vercel-dns.com`.
4. Wait for DNS propagation. Vercel provisions HTTPS automatically.

### Self-hosted

1. Create a DNS A record pointing the subdomain to your server's IP.
2. Configure your reverse proxy for the domain.
3. Set up HTTPS, for example with Let's Encrypt.

If a website vendor such as CivicPlus, Revize, or Granicus manages the town website, ask the vendor to create the DNS record.

## User Management

OpenBook has two types of users:

### Admin users

Admins manage the portal, upload budget data, configure branding, manage staff, and review capital requests.

**Creating the first admin:**

1. Navigate to `/admin/register`.
2. Enter a name, email, and password.
3. The first registered admin can then manage the portal.

After the first admin exists, public registration is locked unless an existing admin is logged in.

### Staff users

Staff members submit capital expenditure requests. They cannot access the admin dashboard.

1. An admin goes to the **Users** tab.
2. The admin enters a staff member's email and clicks **Create Invite**.
3. OpenBook generates a unique invite link and copies it to the admin's clipboard.
4. The admin sends the link to the staff member.
5. The staff member clicks the link, enters their name, password, and department, and creates the account.

Invite links are single-use.

### Email domain restrictions

Admins can restrict staff invites to town email domains. In the **Users** tab, edit "Allowed Email Domains" and enter domains such as `townname.gov` or `town.sutton.ma.us`. If no domains are configured, any email address can be invited.

### Password resets

Admins can generate staff password reset links from the **Users** tab. The link is single-use and expires after use.

## Data Management

All budget data is uploaded through the admin dashboard as CSV or Excel files. Admins can:

- Upload data by category
- Delete individual uploads or wipe all data
- Export/import town configuration through the Transfer tab

Use your Postgres provider's backup tools for database backups. For testing databases, enable scheduled backups if the provider supports them.

## Maintenance

### Updating OpenBook

For Vercel deployments, push changes to the GitHub repository and Vercel redeploys automatically.

For self-hosted deployments:

```bash
git pull
npm install
npm run build
npm start
```

## Troubleshooting

**Stuck creating the first admin account:** confirm `DATABASE_URL` is set in the deployment environment, redeploy, and check the Vercel build/runtime logs for migration errors.

**Migration errors with a pooled database:** add `DIRECT_URL` using the provider's direct connection string, then redeploy.

**No tables exist in the database:** run `npx prisma migrate deploy` with `DATABASE_URL` set, or redeploy on Vercel after adding environment variables.
