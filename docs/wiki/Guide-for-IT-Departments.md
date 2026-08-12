# OpenBook Guide for IT Departments

This guide is for the person setting up and hosting OpenBook for their town. You should be comfortable with a command line, but you do not need to know how to write code. Setup takes a few hours the first time.

---

## Overview of What You Are Setting Up

OpenBook is a web application built with **Next.js** (a standard Node.js web framework). It stores data in a **Postgres database** — you'll need a Postgres connection string from a managed provider (Vercel Storage, Neon, or Supabase all have free tiers) or a Postgres server you run yourself. There is no local database file to manage. Your job is to:

1. Get a Postgres database and the code running on a server
2. Point a web address at it
3. Create the first admin account
4. Hand the login to your finance staff

After that, finance staff manage everything through a browser-based admin panel. You should not need to be involved in day-to-day operations.

---

## Requirements

- **Node.js 18 or higher** (Node 20 LTS recommended) — [nodejs.org](https://nodejs.org)
- **npm 9 or higher** (comes bundled with Node.js)
- A server or hosting account that can run Node.js applications
- A domain name or subdomain pointed at your server
- A **Postgres database connection string** — see Step 1 below

---

## Step 1 — Choose a Hosting Approach

Pick whichever of these matches your situation.

### Option A: Use Your Town's Existing Server Infrastructure

If your town already has a Linux or Windows Server that you manage, and it can run Node.js 18+, you can host OpenBook there.

- On **Linux (Ubuntu/Debian):** Install Node.js using `nvm` or the official NodeSource package. Use `pm2` to keep the app running as a background process.
- On **Windows Server:** Install Node.js from [nodejs.org](https://nodejs.org). Use **PM2 for Windows** or **NSSM** to run it as a Windows service.
- Use your existing reverse proxy (nginx, IIS, Apache) to forward traffic from port 80/443 to the app (which runs on port 3000 by default).

> **Note:** If your town's main website runs on a managed platform like CivicPlus or Granicus, you cannot add OpenBook as a subfolder of that site. Host it separately and use a subdomain (e.g., `budget.yourtown.gov`) pointed at your server.

### Option B: Railway (Recommended for Simplicity)

[Railway](https://railway.app) is a cloud hosting platform that runs Node.js apps with minimal configuration. It has a SOC 2 Type I certification and is appropriate for this use case. Cost is approximately $5–$20/month.

### Option C: Render

[Render](https://render.com) is similar to Railway and has a SOC 2 Type II certification. Also approximately $7–$25/month.

The remaining steps in this guide cover all three options, with notes for each where they differ.

---

## Step 2 — Get the Code

### If hosting on your own server:

Download or clone the repository to your server:

```bash
git clone https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book.git
cd Open-Book
```

If you do not have `git` installed, you can download a ZIP from the GitHub page (click the green **Code** button → **Download ZIP**), upload it to your server, and unzip it.

### If using Railway or Render:

You will connect these services directly to the GitHub repository. You do not need to download anything yourself. Skip to Step 4.

---

## Step 3 — Install Dependencies (Own Server Only)

In your project folder, run:

```bash
npm install
```

This downloads all the packages OpenBook needs. It may take a minute or two.

---

## Step 4 — Provision Postgres and Create the Environment File

OpenBook needs a Postgres database connection string. If you don't already have a Postgres database, create a free one through [Vercel Storage](https://vercel.com/storage), [Neon](https://neon.tech), or [Supabase](https://supabase.com) — any of these take a few minutes and give you a connection string that starts with `postgresql://`. You can also point OpenBook at a Postgres server you run yourself.

Configuration is stored in a file called `.env`.

### On your own server:

```bash
cp .env.example .env
```

Open `.env` in a text editor and set it to:

```
DATABASE_URL="postgresql://user:password@host:5432/openbook?sslmode=require"
```

- `DATABASE_URL` is the Postgres connection string from your database provider.
- If your provider gives you both a **pooled** and a **direct** connection string (common with Neon and Supabase), use the pooled string for `DATABASE_URL` and add the direct string as `DIRECT_URL` — this is used for running migrations.

### On Railway or Render:

You will enter these as **environment variables** in the hosting platform's dashboard (no `.env` file needed). Railway and Render can both provision a Postgres add-on directly, or you can use an external provider as above. In your project settings, look for a "Variables" or "Environment" section and add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | your Postgres connection string |
| `DIRECT_URL` | (optional) direct connection string, if your provider gives you a separate pooled/direct pair |

---

## Step 5 — About Data Persistence

Because OpenBook's data lives in your external Postgres database rather than a file on disk, there is no persistent volume or disk to configure on Railway, Render, or any other platform. Your data survives restarts and redeploys automatically as long as your `DATABASE_URL` keeps pointing at the same Postgres database. Back up your data using your Postgres provider's backup tools (Vercel Storage, Neon, and Supabase all offer automatic backups on paid tiers).

---

## Step 6 — Set Up the Database Tables

OpenBook uses a tool called Prisma to create all the tables it needs inside your Postgres database. You don't need to run this manually — it's already wired into OpenBook's `build` and `dev` commands (`npm run build` and `npm run dev` both apply any pending migrations automatically before starting). You only need to make sure `DATABASE_URL` (and `DIRECT_URL`, if you have one) is set correctly in your `.env` file or hosting platform's environment variables before you start the app.

### On Railway or Render:

No extra build command is needed — the default `npm install && npm run build` (or whatever your platform uses by default) already applies migrations as part of `npm run build`.

---

## Step 7 — Start the Application

### On your own server (development/testing):

```bash
npm run dev
```

This starts the app on port 3000. Visit `http://your-server-ip:3000` to confirm it is working.

### On your own server (production):

For a production server, build and start the optimized version:

```bash
npm run build
npm start
```

To keep it running permanently, use `pm2`:

```bash
npm install -g pm2
pm2 start "npm start" --name openbook
pm2 save
pm2 startup
```

### On Railway or Render:

The platform starts the app automatically after each deploy. Railway uses the `start` script from `package.json` by default. Render should be configured with:
- **Build Command:** `npm install && npm run build` (migrations apply automatically as part of `npm run build`)
- **Start Command:** `npm start`

---

## Step 8 — Set Up the Domain or Subdomain

You want residents to reach the portal at a real web address, not a raw IP or a platform-generated URL.

**Recommended approach:** Create a subdomain on your town's existing domain, such as `budget.yourtown.gov`. This is a DNS change — it does not involve your CivicPlus or other website vendor.

### To create the subdomain:

1. Log into wherever your town manages its DNS records (usually your domain registrar, or your IT vendor if they manage DNS for you).
2. Add a new **CNAME record**:
   - **Name/Host:** `budget` (or whatever subdomain you want)
   - **Points to / Value:** the address provided by your hosting platform
     - Railway gives you a URL like `openbook-production.up.railway.app`
     - Render gives you a URL like `openbook.onrender.com`
     - For your own server: create an **A record** pointing to your server's IP address
3. Save the record. DNS changes can take 10–60 minutes to propagate.

### On Railway or Render:

After setting up DNS, add your custom domain in the platform:
- **Railway:** Settings → Domains → Custom Domain → enter your subdomain
- **Render:** Settings → Custom Domains → Add Custom Domain

Both platforms will provide an SSL certificate automatically (HTTPS). No additional configuration needed.

### On your own server:

Set up a reverse proxy to forward requests to port 3000. With **nginx**, a minimal configuration looks like:

```nginx
server {
    listen 80;
    server_name budget.yourtown.gov;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

For HTTPS, use **Certbot** (free) to get an SSL certificate:

```bash
sudo certbot --nginx -d budget.yourtown.gov
```

---

## Step 9 — Create the First Admin Account

Once the app is running and the domain is live, go to:

```
https://budget.yourtown.gov/admin/register
```

Fill in:
- A name for the admin account (e.g., "Finance Department")
- An email address for the account
- A password (at least 8 characters)

Click **Create Account**. You'll be signed in immediately and shown a confirmation screen with a link to continue to town setup. OpenBook also sends a verification email to the address you registered with — click the link in that email to verify it.

> **The first person to register automatically becomes the administrator.** After that, this page is locked — nobody else can register a new admin account unless an existing admin is signed in and creates one for them. This is intentional: it's what prevents a stranger from quietly creating their own admin account on your live portal.

---

## Step 10 — Hand Off to Finance Staff

Give your finance staff:
- The URL for the public portal: `https://budget.yourtown.gov`
- The URL for the admin panel: `https://budget.yourtown.gov/admin/login`
- The email and password for the admin account

Point them to the **Finance Staff Guide** in this wiki. Your involvement from this point forward should be minimal — only needed if the app stops running or you need to apply code updates.

---

## Applying Code Updates

When the OpenBook team releases updates, here is how to apply them:

### On your own server:

```bash
git pull origin main
npm install
npm run build
pm2 restart openbook
```

(`npm run build` applies any new database migrations automatically — no separate Prisma command needed.)

### On Railway or Render:

If you connected the service to the GitHub repository directly, updates deploy automatically when the repository is updated. Otherwise, trigger a manual redeploy from the platform dashboard.

---

## Troubleshooting

**The app crashes on startup with a database error:**
Confirm `DATABASE_URL` (and `DIRECT_URL`, if used) is set correctly and the database is reachable, then restart — `npm run build`/`npm run dev` apply any pending migrations automatically on startup.

**"0 rows after uploading" in the admin panel:**
This is a data issue, not a hosting issue. Point your finance staff to the upload troubleshooting section of their guide.

**The site is slow or timing out:**
Check that `DATABASE_URL` points at a healthy, reachable Postgres database. A misconfigured or unreachable database causes the app to fail silently on some platforms.

**Need to transfer admin access to a new person:**
The finance staff can do this themselves from the admin panel under the **Transfer** tab — no IT involvement needed.
