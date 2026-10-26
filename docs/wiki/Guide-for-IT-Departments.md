# OpenBook Guide for IT Departments

This guide is for the person setting up and hosting OpenBook for their town. You should be comfortable with a command line, but you don't need to write code. Expect a few hours the first time.

Your job is to get OpenBook running at a web address such as `budget.yourtown.gov`, create the first admin account, and hand it to finance staff. After that, they manage everything from a browser, and you're only needed for updates or outages.

**Contents**

- [Prerequisites and hosting options](#prerequisites-and-hosting-options)
- [Database setup](#database-setup)
- [Option A: Vercel](#option-a-vercel)
- [Option B: Railway or Render](#option-b-railway-or-render)
- [Option C: Self-hosted server](#option-c-self-hosted-server)
- [Environment variables](#environment-variables)
- [First admin account](#first-admin-account)
- [Handoff to finance staff](#handoff-to-finance-staff)
- [Updates](#updates)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites and hosting options

OpenBook is a Next.js (Node.js) web app that stores all of its data in a Postgres database. You need:

- A hosting option (choose one below)
- A Postgres database (see the next section)
- Access to your town's DNS records, to create a subdomain such as `budget.yourtown.gov`

**Hosting options:**

| Option | Choose it if… | Cost |
| --- | --- | --- |
| [Option A: Vercel](#option-a-vercel) | You want the fastest, lowest-maintenance setup. Vercel is made by the company behind Next.js, so OpenBook works there without configuration, and it handles servers, HTTPS, and redeploys for you. | Free Hobby tier; paid plans from about $20/month |
| [Option B: Railway or Render](#option-b-railway-or-render) | You want a managed host like Vercel but prefer a paid plan from the start, or your town already uses one of these platforms. | About $5–$25/month |
| [Option C: Self-hosted server](#option-c-self-hosted-server) | Your town already runs its own servers, or policy requires keeping systems in-house. You'll handle updates, HTTPS certificates, and uptime yourself. | Usually no added cost |

Options A and B deploy from your own copy of the code on GitHub, called a *fork*. Create one by clicking **Fork** on the [OpenBook repository](https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book) while signed in to your town's GitHub account. You control when your fork takes updates.

If your town's website runs on a managed platform like CivicPlus or Granicus, OpenBook can't be a page within it. Host it separately and use a subdomain; that's a DNS change and doesn't involve your website vendor.

---

## Database setup

All paths need a Postgres connection string, a single line starting with `postgresql://` that tells OpenBook where the database is and how to log in. Free hosted options:

- [Neon](https://neon.tech): create a project, click **Connect**, and copy the string.
- [Supabase](https://supabase.com): create a project, then go to **Project Settings → Database → Connection string** (URI format).
- [Vercel Storage](https://vercel.com/storage), Railway, and Render can also create a Postgres database inside your hosting account.

You can also use a Postgres server your town already runs.

If your provider shows two strings, **pooled** and **direct**, copy both. The pooled one goes in `DATABASE_URL` and the direct one in `DIRECT_URL`. Treat both like passwords.

All of your town's data (budget rows, settings, documents, accounts) lives in this database, so restarting or redeploying the app never loses anything. Set up backups with your database provider.

---

## Option A: Vercel

1. **Fork the repository** to your town's GitHub account (see [Prerequisites and hosting options](#prerequisites-and-hosting-options)).
2. **Import it.** In [Vercel](https://vercel.com), click **Add New Project** and select your fork.
3. **Add environment variables.** Under **Environment Variables**, add `DATABASE_URL`, and `DIRECT_URL` if you have one. See [Environment variables](#environment-variables) for the optional ones.
4. **Click Deploy.** Vercel builds the app, creates the database tables, and gives you a `*.vercel.app` URL.
5. **Add your domain.** In the project, go to **Settings → Domains → Add** and enter your subdomain. Vercel shows the DNS record to create, usually a CNAME pointing to `cname.vercel-dns.com`. Create it wherever your town manages DNS. Vercel adds HTTPS automatically once the record takes effect, typically within an hour.
6. [First admin account](#first-admin-account).

Vercel redeploys automatically whenever your fork changes.

---

## Option B: Railway or Render

1. **Fork the repository** to your town's GitHub account (see [Prerequisites and hosting options](#prerequisites-and-hosting-options)).
2. **Create the service from your fork.**
   - **Railway:** **New Project → Deploy from GitHub repo**, then pick your fork. The default build and start commands work.
   - **Render:** **New → Web Service**, then pick your fork. Set **Build Command** to `npm install && npm run build` and **Start Command** to `npm start`.
3. **Add environment variables.** In the service's **Variables** (Railway) or **Environment** (Render) tab, add `DATABASE_URL`, and `DIRECT_URL` if you have one. See [Environment variables](#environment-variables) for the optional ones.
4. **Deploy.** The build creates the database tables automatically, and you get a platform URL such as `openbook-production.up.railway.app` or `openbook.onrender.com`.
5. **Add your domain.** Add your subdomain in the service's settings (Railway: **Settings → Networking → Custom Domain**; Render: **Settings → Custom Domains**). Then, wherever your town manages DNS, create a CNAME record pointing to the address the platform shows. HTTPS is added automatically.
6. [First admin account](#first-admin-account).

The service redeploys automatically whenever your fork changes.

---

## Option C: Self-hosted server

These commands are for Linux (Ubuntu/Debian). On Windows Server, the OpenBook steps are the same, but use [NSSM](https://nssm.cc) instead of pm2, IIS (with URL Rewrite and Application Request Routing) instead of nginx, and [win-acme](https://www.win-acme.com) instead of Certbot.

1. **Install Node.js 20.9 or newer**, using `nvm` or the NodeSource package.

2. **Get the code.**

   ```bash
   git clone https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book.git
   cd Open-Book
   ```

3. **Create the settings file.**

   ```bash
   cp .env.example .env
   ```

   Open `.env` and replace the sample value after `DATABASE_URL=` with your own connection string, keeping the quotation marks. If you have a direct string, remove the `#` before `DIRECT_URL` and paste it there. Do this before the next step, because the install reads `DATABASE_URL`. See [Environment variables](#environment-variables) for the optional settings.

4. **Install, build, and start.**

   ```bash
   npm install
   npm run build    # also creates the database tables
   npm install -g pm2
   pm2 start "npm start" --name openbook
   pm2 save
   pm2 startup      # then run the command it prints, so OpenBook starts on reboot
   ```

   OpenBook now runs on port 3000. Use `npm run build` and `npm start` (as above), not `npm run dev`, which is only for testing on your own computer.

5. **Point your subdomain at the server.** Wherever your town manages DNS, create an **A record** for your subdomain (e.g. `budget`) pointing to the server's public IP address.

6. **Set up nginx and HTTPS.** Create a site config that forwards traffic to port 3000:

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

   Then get a free certificate:

   ```bash
   sudo certbot --nginx -d budget.yourtown.gov
   ```

   HTTPS is required: OpenBook's login only works over a secure connection.

7. [First admin account](#first-admin-account).

---

## Environment variables

On your own server, these go in `.env`. On Vercel, Railway, or Render, add them in the platform's dashboard instead.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Your Postgres connection string (the pooled one, if you have two). |
| `DIRECT_URL` | No | The direct connection string, if your provider gave you a pooled/direct pair. Used to update the database tables. |
| `RESEND_API_KEY` | No | A [Resend](https://resend.com) key for emailing the admin a verification link. Without it, the link is written to the server log, and nothing depends on it. |
| `NEXT_PUBLIC_APP_URL` | No | Your public address, e.g. `https://budget.yourtown.gov`, used in email links. |

OpenBook doesn't email staff invites or password resets; admins copy those links and send them themselves.

---

## First admin account

As soon as your site is live with HTTPS, go to `https://budget.yourtown.gov/admin/register` and enter a name (e.g. "Finance Department"), an email, and a password of at least 8 characters. You're signed in immediately.

The first person to register becomes the administrator. After that, the page is locked, and only a signed-in admin can create another admin account.

---

## Handoff to finance staff

Give your finance staff:

- The public portal: `https://budget.yourtown.gov`
- The admin login: `https://budget.yourtown.gov/admin/login`
- The admin email and password

Point them to the [Guide for Finance Staff](Guide-for-Finance-Staff). If the admin later changes hands, they can use the **Transfer** tab in the admin panel without your help.

---

## Updates

Fixes reach your portal only when you update your copy of the code. Plan to do this once or twice a year, or when a fix you need is released. Updates never touch your town's data, which lives in the database; any database changes are applied automatically during the build and preserve existing data.

**Options A and B (fork):** your fork doesn't update itself. Open it on GitHub; if a banner says it's behind `Allen-Lab-for-Democracy-Renovation:main`, click **Sync fork → Update branch**. Your host redeploys within a few minutes. Wait for the deploy to finish before telling staff.

**Option C (self-hosted server):**

```bash
git pull origin main
npm install
npm run build
pm2 restart openbook
```

If you've edited the code yourself, an update may report a merge conflict where your changes overlap with the project's. Keeping your edits small makes these easier to resolve.

---

## Troubleshooting

- **App fails to start with a database error:** check that `DATABASE_URL` (and `DIRECT_URL`, if used) is correct and the database is reachable. Then redeploy, or on your own server run `npm run build` and `pm2 restart openbook`.
- **Site is slow or times out:** usually the database is unreachable or misconfigured. Check `DATABASE_URL` and your provider's status page.
- **Registration or sign-in doesn't stick:** make sure you're using the `https://` address.
- **Uploads produce 0 rows:** this is a data formatting issue, not a hosting one. Point finance staff to their guide.
- **Something else:** [open a GitHub issue](https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book/issues/new) with what you did, what happened, and any relevant log lines, or email Sarah Hubbard at [sarah_hubbard@hks.harvard.edu](mailto:sarah_hubbard@hks.harvard.edu).
