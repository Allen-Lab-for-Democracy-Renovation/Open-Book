# Local Testing Guide

This guide is for IT staff or developers who want to run OpenBook on their own computer before deploying it. It's a good way to explore the app, try out a code change, or review an update before it goes live.

A local copy runs at `http://localhost:3000` and only you can see it. **You don't need this to use OpenBook.** If you're ready to go live, skip to the [Guide for IT Departments](Guide-for-IT-Departments).

**Contents**

- [Prerequisites](#prerequisites)
- [Step 1: Get the code](#step-1-get-the-code)
- [Step 2: Set up the database](#step-2-set-up-the-database)
- [Step 3: Install dependencies](#step-3-install-dependencies)
- [Step 4: Start the app](#step-4-start-the-app)
- [Step 5: Create an admin account](#step-5-create-an-admin-account)
- [Step 6: Load sample data (optional)](#step-6-load-sample-data-optional)
- [Stopping and restarting](#stopping-and-restarting)
- [Pulling updates](#pulling-updates)
- [Resetting the test database](#resetting-the-test-database)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Commands go in a **terminal**. On macOS, press Cmd + Space, type "Terminal", and press Enter. On Windows, press the Windows key, type "PowerShell", and press Enter.

- **Node.js 20.9 or newer.** Download the LTS version from [nodejs.org](https://nodejs.org); it includes `npm`. Check it worked by running `node --version`.
- **A Postgres database.** Either:
  - [Docker](https://www.docker.com/products/docker-desktop/), to run Postgres on your own computer, or
  - a free hosted database from [Neon](https://neon.tech) or [Supabase](https://supabase.com), if you'd rather not install Docker.
- **Git** (optional). It makes pulling updates easier. Install it from [git-scm.com](https://git-scm.com/downloads).

---

## Step 1: Get the code

With Git:

```bash
git clone https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book.git
cd Open-Book
```

Without Git, click **Code → Download ZIP** on the [GitHub page](https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book) and unzip it. Then type `cd ` (with a trailing space) in your terminal, drag the unzipped folder onto the window, and press Enter.

---

## Step 2: Set up the database

OpenBook connects to Postgres with a *connection string*, a single line starting with `postgresql://`.

**Option A: Docker.** Start a local Postgres server:

```bash
docker run --name openbook-postgres -e POSTGRES_USER=openbook -e POSTGRES_PASSWORD=openbook -e POSTGRES_DB=openbook -p 5432:5432 -d postgres:16-alpine
```

Your connection string is `postgresql://openbook:openbook@localhost:5432/openbook`.

**Option B: Neon or Supabase.** Create a free project and copy its connection string. On Neon, click **Connect**; on Supabase, go to **Project Settings → Database → Connection string** (URI format).

Next, create the settings file:

```bash
cp .env.example .env
```

Open `.env` in any text editor and replace the whole sample value after `DATABASE_URL=` with your connection string, keeping the quotation marks. For Docker, that's:

```
DATABASE_URL="postgresql://openbook:openbook@localhost:5432/openbook"
```

If your hosted provider shows two strings, **pooled** and **direct**, put the pooled one in `DATABASE_URL`, then remove the `#` before `DIRECT_URL` and paste the direct one there.

Do this before Step 3, because the install reads this file.

---

## Step 3: Install dependencies

```bash
npm install
```

This takes a few minutes the first time. Lots of scrolling text is normal.

---

## Step 4: Start the app

```bash
npm run dev
```

This also creates the database tables, so there's no separate setup command. When you see `Ready`, open <http://localhost:3000>. The app runs only while this terminal stays open.

---

## Step 5: Create an admin account

Go to <http://localhost:3000/admin/register> and enter a name, an email, and a password of at least 8 characters. The first person to register becomes the admin and is signed in immediately.

From here, the [Guide for Finance Staff](Guide-for-Finance-Staff) covers everything in the admin panel.

---

## Step 6: Load sample data (optional)

To see a filled-in portal without uploading your own spreadsheets, open a second terminal in the project folder and run:

```bash
npm run seed
```

This creates a demo town called Sutton from the files in `sample-data/`. Visit <http://localhost:3000/sutton> to see it.

The seed only works on a database with no town in it, so skip it if you've already saved a town in **Settings**. If you have, and want the sample instead, [reset the database](#resetting-the-test-database) first.

---

## Stopping and restarting

Press **Ctrl + C** in the terminal to stop the app, and run `npm run dev` again to restart. Your data is kept in the database between runs.

If you used Docker and restarted your computer, start the database again first:

```bash
docker start openbook-postgres
```

---

## Pulling updates

To test the latest version:

```bash
git pull origin main
npm install
npm run dev
```

Any database changes are applied automatically when the app starts.

---

## Resetting the test database

To wipe everything and start fresh with Docker:

```bash
docker rm -f openbook-postgres
```

Then rerun the `docker run` command from [Step 2](#step-2-set-up-the-database), run `npm run dev`, and run `npm run seed` if you want the sample back.

With Neon or Supabase, reset or recreate the database from the provider's dashboard instead. Never do this to a database anyone else is using.

---

## Troubleshooting

- **`command not found: node` or `npm`:** install Node.js, then close and reopen the terminal.
- **"Cannot find module" on startup:** run `npm install` again.
- **Database errors on startup:** check that `DATABASE_URL` in `.env` is correct. With Docker, run `docker ps` to confirm `openbook-postgres` is running. If errors continue, [reset the database](#resetting-the-test-database).
- **Port 3000 is already in use:** close the other program, or run `npm run dev -- --port 3001` and open <http://localhost:3001>.
- **Changes aren't showing up:** most changes appear automatically. If something seems stuck, stop the app with Ctrl + C and run `npm run dev` again.
- **Something else:** [open a GitHub issue](https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book/issues/new) or email Sarah Hubbard at [sarah_hubbard@hks.harvard.edu](mailto:sarah_hubbard@hks.harvard.edu).
