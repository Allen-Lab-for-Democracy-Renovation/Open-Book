# Local Testing Guide (Optional — For IT Departments)

This guide is for IT staff or developers who want to run OpenBook on their own computer before deploying it to a live server. This is useful for testing the software, exploring how it works, or reviewing updates before they go live.

**You do not need to do this to use OpenBook.** If you are ready to deploy to a live server, go directly to the [IT Department Guide](Guide-for-IT-Departments).

---

## What "Running Locally" Means

Running OpenBook locally means the app runs on your own laptop or desktop. It is only accessible from your computer — no one else can visit it. The web address will be `http://localhost:3000` instead of a real domain name.

This is useful for:
- Seeing how the app works before committing to a server
- Testing a code change before pushing it live
- Reviewing new updates from the OpenBook team before deploying them

---

## Prerequisites

Install both of these before starting:

**1. Node.js 18 or higher**
Download from [nodejs.org](https://nodejs.org). Choose the version labeled **LTS** (Long Term Support). Run the installer and accept all defaults.

To verify it installed correctly, open a terminal and type:
```bash
node --version
```
You should see a version number like `v20.x.x`.

**2. npm (comes with Node.js)**
Verify it is available:
```bash
npm --version
```
You should see a version number like `9.x.x` or higher.

---

## Step 1 — Download the Code

Go to the OpenBook GitHub page and click the green **Code** button, then **Download ZIP**. Save the ZIP file somewhere easy to find (like your Desktop) and unzip it.

Or, if you have `git` installed:
```bash
git clone https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book.git
```

---

## Step 2 — Open a Terminal in the Project Folder

**On Mac:**
Open the Terminal app (search for it with Cmd + Space). Then navigate into the project folder:
```bash
cd ~/Desktop/Open-Book
```
*(Adjust the path if you saved it somewhere else.)*

**On Windows:**
Open Command Prompt or PowerShell. Navigate into the project folder:
```
cd C:\Users\YourName\Desktop\Open-Book
```

---

## Step 3 — Install Dependencies

```bash
npm install
```

This downloads everything the app needs. It may take a minute or two. You will see a lot of text — that is normal.

---

## Step 4 — Create the Settings File

OpenBook needs a Postgres database, even for local testing. The easiest way to get one on your own computer is to run Postgres in Docker; if you don't want to install Docker, you can instead create a free database in a few minutes at [Neon](https://neon.tech) or [Supabase](https://supabase.com) and use that connection string instead.

**Option A — Docker (runs entirely on your computer):**
```bash
docker run --name openbook-postgres -e POSTGRES_USER=openbook -e POSTGRES_PASSWORD=openbook -e POSTGRES_DB=openbook -p 5432:5432 -d postgres:16-alpine
```
This starts a local Postgres server. Your connection string will be `postgresql://openbook:openbook@localhost:5432/openbook`.

**Option B — Free hosted database (Neon or Supabase):**
Create a free project and copy the connection string it gives you (it starts with `postgresql://`).

Then create your settings file:
```bash
cp .env.example .env
```

On Windows:
```
copy .env.example .env
```

Open the `.env` file in any text editor (Notepad, TextEdit, VS Code) and set:

```
DATABASE_URL="postgresql://openbook:openbook@localhost:5432/openbook"
```

(Use your own connection string if you chose Option B instead.)

---

## Step 5 — Set Up the Database

Nothing extra to run here — `npm run dev` (Step 6) applies any pending database migrations automatically before starting the app, as long as `DATABASE_URL` in your `.env` file is set correctly.

---

## Step 6 — Start the App

```bash
npm run dev
```

After a few seconds you will see:
```
▲ Next.js 16.x.x (Turbopack)
  - Local: http://localhost:3000
✓ Ready in Xms
```

Open your browser and go to **http://localhost:3000**. You should see the OpenBook homepage.

---

## Step 7 — Create an Admin Account

Go to:
```
http://localhost:3000/admin/register
```

Enter a name, email, and password (at least 8 characters).

Click **Create Account**. You'll be signed in immediately — the first person to register automatically becomes the administrator.

---

## Step 8 — Load Sample Data (Optional)

If you want to see the portal with realistic budget data already filled in, run:

```bash
npm run seed
```

This loads sample budget data from the `sample-data/` folder in the project. After seeding, go to `http://localhost:3000` and you will see a working portal with charts and tables populated.

---

## Stopping and Restarting the App

To stop the app, go back to your terminal and press **Ctrl + C**.

To start it again later, just run `npm run dev` again from the project folder. Your data will still be there — it is saved in your Postgres database (either the Docker container from Step 4, or your hosted database if you chose that option). If you used the Docker option and stopped the container, start it again with `docker start openbook-postgres` before running `npm run dev`.

---

## Pulling Updates

If the OpenBook team has released updates and you want to test them locally:

```bash
git pull origin main
npm install
```

Then restart the app with `npm run dev` — any new database migrations are applied automatically on startup.

---

## Common Issues

**"Cannot find module" error on startup**
Run `npm install` again and retry.

**Database errors after pulling updates**
Migrations apply automatically the next time you run `npm run dev`, so first make sure `DATABASE_URL` in your `.env` file is still correct and your database is reachable (if you used the Docker option, confirm the container is running with `docker ps`). If errors persist and you're using the Docker option, you can wipe your local test database entirely and start fresh:
```bash
docker rm -f openbook-postgres
```
Then repeat Step 4's Docker command to create a new empty database, and run `npm run dev` followed by `npm run seed` if you want sample data back. (If you're using a hosted database from Neon or Supabase instead, use that provider's dashboard to reset it — don't run this against a database anyone else is using.)

**Port 3000 is already in use**
Another app is using that port. Either stop the other app, or run OpenBook on a different port:
```bash
npm run dev -- --port 3001
```
Then visit `http://localhost:3001`.

**Changes are not showing up**
The app uses hot reloading, so most changes appear automatically. If something seems stuck, stop the app (Ctrl + C) and run `npm run dev` again.
