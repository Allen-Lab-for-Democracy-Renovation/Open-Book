# OpenBook

A municipal budget transparency platform. OpenBook lets towns publish their budgets online so residents can explore expenses, revenues, and capital projects in plain language.

![Homepage](docs/screenshots/homepage.png)

## Who this guide is for

This README is written so that **anyone** — including people who have never written code or used a "terminal" before — can set up OpenBook on their own computer and try it out. If you are technical, skim past the explanatory sidebars. If you are not, follow each step in order; nothing is skipped, and every command is explained.

A short **glossary** at the bottom defines any term that looks unfamiliar (look for words in bold, like **terminal** or **repository**, in the steps below).

## Town Budget Portal

Each town gets a branded portal with tabbed navigation across budget categories, summary tiles, interactive charts, searchable line-item tables, exportable data, and a printable budget book.

![Town Portal](docs/screenshots/town-portal.png)

## Admin Dashboard

Town administrators upload budget data (CSV or Excel), customize portal branding, add plain-language tooltips for budget items, manage supporting documents, and respond to resident questions.

![Admin](docs/screenshots/admin-upload.png)

---

# Part 1 — Getting OpenBook running on your computer

This part is a complete walk-through from a fresh computer to a running OpenBook on your own machine. If you already have Node.js and have used Git before, jump to [Quick start](#quick-start).

## Before you begin: what you need on your computer

You need a few things before OpenBook can run. They are free, official, and safe to install.

### 1. Node.js (version 18 or newer; 20 LTS recommended)

**What it is.** Node.js is the program that runs OpenBook on your computer. OpenBook is written in a language called JavaScript/TypeScript, and Node.js is what reads and executes it. Installing Node.js also installs **`npm`** ("node package manager"), which downloads the small building-block libraries OpenBook depends on so you don't have to.

**How to install it.**

- Go to <https://nodejs.org> in your web browser.
- Click the big green button labeled "LTS" (Long-Term Support).
- Open the downloaded file and follow the installer prompts (you can accept all the defaults).

To check that it worked, open your **terminal** (see below) and type:

```bash
node --version
npm --version
```

You should see two version numbers print out, something like `v20.11.1` and `10.2.4`. If you see "command not found," the installer didn't finish — try installing again.

### 2. A "terminal" application

**What it is.** A **terminal** (also called a "command line" or "shell") is a text-based way to give your computer instructions. Instead of clicking, you type a command and press Enter. OpenBook needs to be started from a terminal.

**Where to find it.**

- **macOS**: Open the **Terminal** app. The easiest way: press `Cmd + Space`, type `Terminal`, and press Enter.
- **Windows**: Open **PowerShell** or **Windows Terminal**. Press the Windows key, type `PowerShell`, and press Enter.
- **Linux**: Use whatever terminal your distribution ships with (often Ctrl+Alt+T opens one).

When the terminal opens you'll see a blinking prompt. That's where you type the commands below. You don't need to type the `$` at the start — that's just shorthand for "this is a terminal command."

### 3. (Optional but recommended) Git

**What it is.** **Git** is a tool for downloading and tracking changes to code. The OpenBook code lives in a **repository** on GitHub. You can either use Git to download it (the standard way) or download a ZIP file from the GitHub website (no Git required). Both are explained below.

If you want to install Git: go to <https://git-scm.com/downloads> and run the installer for your operating system.

### 4. A Postgres database connection string

**What it is.** Postgres is the database OpenBook uses to store town settings, uploaded budget rows, staff invites, and admin accounts. You can run Postgres on your own computer, but for testing it is usually easiest to create a free hosted database through Vercel Storage, Neon, or Supabase.

After creating the database, copy its connection string. It usually starts with `postgresql://`. You will paste it into `.env.local` in the steps below.

## Quick start

If you already have Node.js installed and you have the project files on your computer, here are the commands:

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Postgres DATABASE_URL
npm run dev
```

Open <http://localhost:3000> in your browser.

The rest of this section explains each step for people who haven't done this before.

## Step-by-step setup

### Step 1: Download the OpenBook code

You need a copy of OpenBook's files on your computer. Pick one of these two options.

**Option A — Using Git (recommended).** In your terminal, type:

```bash
git clone https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book.git
cd Open-Book
```

The first command copies the project into a new folder called `Open-Book`. The second (`cd`, "change directory") moves the terminal _into_ that folder so the next commands operate on OpenBook's files.

**Option B — Without Git.** Go to <https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book>, click the green "Code" button, and choose "Download ZIP." Unzip the file somewhere convenient (for example, your Documents folder). Then in your terminal, navigate into that folder. For example:

```bash
cd ~/Documents/Open-Book-main
```

(Replace the path with wherever you unzipped the file. If you're unsure, type `cd ` — note the space — and then drag the unzipped folder from your file browser onto the terminal window; the path will fill in automatically.)

### Step 2: Install OpenBook's dependencies

OpenBook is built on top of many small pieces of free, open-source software (called **packages** or **dependencies**). `npm install` reads OpenBook's list of needed packages (in `package.json`) and downloads them into a folder called `node_modules`. This usually takes 1–3 minutes the first time.

In the same terminal window, type:

```bash
npm install
```

You will see a lot of output scroll by — that's normal. As long as the final line doesn't say "ERROR," you're good.

**Behind the scenes**, `npm install` also runs a one-time setup step called `prisma generate` that prepares the database connection code. You don't need to do anything for this; it happens automatically.

### Step 3: Configure the database

OpenBook reads its database settings from a local file named `.env.local`. Create that file by copying the example:

```bash
cp .env.example .env.local
```

Open `.env.local` in a text editor and replace the sample `DATABASE_URL` value with your Postgres connection string.

If your database provider gives you both a pooled connection string and a direct connection string, use the pooled string for `DATABASE_URL` and the direct string for `DIRECT_URL`.

### Step 4: Start OpenBook

Type:

```bash
npm run dev
```

What this does:

1. Connects to the Postgres database from `.env.local`.
2. Applies all of OpenBook's data-structure setup ("migrations") to that database.
3. Starts the web server.

After a few seconds you'll see a message like `Ready in 2.1s` and a URL: <http://localhost:3000>. Open that URL in your web browser and OpenBook will load.

**Important: leave this terminal window open.** As long as `npm run dev` is running, OpenBook is running. If you close the window or press `Ctrl + C` in it, OpenBook stops. To start it again later, open a new terminal, navigate to the project folder with `cd`, and run `npm run dev` again.

### Step 5 (optional): Load sample data

OpenBook starts empty, so the public portal won't have anything to show until you upload data. If you want to see what a populated portal looks like immediately, you can load a small set of pretend data:

```bash
npm run seed
```

Run this in a **second** new terminal window (so the first one can keep running OpenBook). Refresh your browser and you'll see a sample town with budget data already in it.

---

# Part 2 — Setting up your town's portal

Once OpenBook is running, the actual work happens in your web browser at <http://localhost:3000>. There's no more terminal involvement unless you need to restart the server. To stop the page from running or quit a session, run `Ctrl + C` in the terminal tab.

The admin dashboard has a top navigation bar; the sections below correspond to those tabs and are meant to be done in order.

## 1. Create an admin account

Go to <http://localhost:3000/admin/register>.

The **first person who registers automatically becomes the administrator**. After that, the registration page is locked unless you (the admin) are signed in. This is a security feature — once you've claimed the admin account, nobody else can quietly create one on your portal.

Then sign in at <http://localhost:3000/admin/login>.

## 2. Configure your town (Settings tab)

Go to `/admin/setup`. You'll fill in:

- **Town name and slug** — the _slug_ is the short URL-friendly version of the town's name (for example, "Anytown" might become `anytown`). Your portal's address becomes `/your-town-slug`.
- **Primary color** — the accent color used for charts and links on the public site.
- **Logo** — an image (your town seal, for example) that appears as the browser tab icon and at the top of pages.
- **Contact email** — where resident questions will be sent.
- **About text** — a short description that appears on the portal homepage.
- **Invite code** — a shared code that town staff use when self-registering at `/staff/register`. Pick something only staff would know.

## 3. Upload budget data (Upload tab)

The upload flow has three steps:

1. **Pick a category** — Expenses, Revenues, Capital Projects, or Reserves. A sample table appears so you can see what shape OpenBook is expecting.
2. **Drop in a CSV or Excel file** — up to 10 MB. **CSV** stands for "Comma-Separated Values"; it's a simple spreadsheet format you can save from Excel or Google Sheets via "File → Save As → CSV." Excel `.xlsx` files also work. After upload, OpenBook shows a preview of the first two rows so you can confirm it read the file correctly.
3. **Map your columns** — OpenBook reads your column headers (like `Department` or `FY2026 Budget`) and guesses what each one means. Columns it's confident about are tagged "Auto." For anything ambiguous, you pick from a dropdown. If you skip a required field, a warning lists exactly what's missing — you can't save until those are resolved.

Each category has its own required fields:

| Category         | Required mappings                                                     |
| ---------------- | --------------------------------------------------------------------- |
| Expenses         | Function Area, Fiscal Year Amount (with at least one set to "Budget") |
| Revenues         | Category, Fiscal Year Amount (with at least one set to "Budget")      |
| Capital Projects | Department, Purpose, Funding Source, Fiscal Year Amount               |
| Reserves         | (no public page yet — data is stored but not rendered)                |

Examples of well-formatted data files are in the `sample-data/` folder inside the project — open them in Excel or a text editor if you want a template to follow.

Sample Data (Capital)
![Capital](docs/screenshots/sample-data-capital.png)

Sample Data (Revenue)
![Revenue](docs/screenshots/sample-data-revenue.png)

**Tip:** uploads work best when each row represents a single category or line amount rather than a specific year, and when extraneous cells (totals, titles, blank rows above the headers) are removed before upload.

## 4. Manage existing data (Data tab)

`/admin/data` lists every file you've uploaded along with its category, row count, status, and date. From here you can:

- **Download** an upload as a CSV (rebuilt from the saved data — useful for taking a backup or moving data elsewhere).
- **Replace** an upload (deletes it and opens the upload page so you can re-upload a corrected file).
- **Delete** an upload (removes it and all its rows from the portal).
- **Delete All Data** (a "start over" button at the bottom; requires a second click to confirm).

Different categories live independently — uploading a Revenues file does not affect your Expenses data, and vice versa. Use **Upload New Data** to add another file alongside what's already there.

## 5. Polish the portal

Once data is uploaded, several optional features make the portal more useful for residents:

- **Tooltips** (`/admin/tooltips`) — short, plain-language explanations that show up when residents hover or tap a `?` icon next to a budget category or line item. Keep them short and non-essential — they should clarify, not be required reading.
- **Links** (`/admin/links`) — supporting external links (e.g., town meeting warrants, audit reports) shown on the portal.
- **PDFs** (`/admin/documents`) — uploadable PDF documents (annual reports, fee schedules, etc.).
- **FAQs** (`/admin/faqs`) — frequently asked questions that appear on the portal's FAQ tab.
- **Requests** (`/admin/requests`) — review and approve capital expenditure requests submitted by town staff via `/staff`.
- **Transfer** (`/admin/transfer`) — export/import town data to move it between environments (for example, from your laptop to a shared server).

## 6. Preview the public site

The admin header has a **Preview** link that opens your public portal (`/[townSlug]`) in a new browser tab, so you can see exactly what residents will see while you continue editing.

---

# Part 3 — What residents, admins, and staff can do

### For residents

- Budget overview with year-over-year comparisons
- Expense and revenue breakdowns by department and function (pie charts, stacked trend bars)
- Capital project listings with funding sources
- Searchable line-item tables with CSV export
- Printable budget book generation
- FAQ page with expandable answers
- Supporting documents and external links
- Plain-language tooltips on budget items

### For administrators

- CSV/Excel upload with automatic column detection and per-category validation
- Sample-data preview while picking a category
- Portal branding (name, colors, logo, contact info, about text)
- Tooltip authoring for categories and line items
- Document and link management
- Resident question inbox with reply functionality
- Staff capital request review and approval
- One-click public-site preview from the admin header

### For town staff

- Account creation via admin-issued invite links
- Capital expenditure request submission
- Request tracking and status updates

## IT Onboarding

For the full step-by-step deployment guide, see the **[IT Department Guide on the wiki](https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book/wiki/Guide-for-IT-Departments)**.

### Path A — Vercel (Recommended)

1. Fork this repository to your town's GitHub account
2. Create a Postgres database through Vercel Storage, Neon, or Supabase
3. Create a free account at [vercel.com](https://vercel.com)
4. Click **Add New Project** and import your fork
5. Add the database connection strings in Vercel environment variables
6. Click **Deploy**

Vercel builds the app, applies migrations, and gives you a live URL. Connect a custom domain (e.g. `budget.yourtown.gov`) in Vercel's domain settings. Updates deploy automatically when you push to your fork.

### Path B — Self-Hosted

Any server with Node.js 20+ works:

```bash
git clone https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book.git
cd Open-Book
npm install
cp .env.example .env.local
# Edit .env.local with your Postgres DATABASE_URL
npm run build
npm start
```

The app runs on port 3000. Use `pm2` to keep it running, a reverse proxy (nginx) for SSL, and Certbot for a free certificate.

### After Deploying

1. Go to `/admin/register` to create the first admin account (locks after first use)
2. Hand the login to your town manager — they handle everything from the admin panel
3. Back up the Postgres database using your database provider's backup tools

---

# Part 4 — Reference (for the technically curious)

You do not need any of this section to use OpenBook. It's here for anyone who wants to understand or modify how it works.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: Postgres via Prisma 7 with the pg adapter
- **Styling**: Tailwind CSS v4
- **Charts**: Chart.js + react-chartjs-2
- **Data import**: PapaParse (CSV), SheetJS (Excel)
- **Auth**: scrypt-hashed passwords, HTTP-only session cookies

## Environment Variables

| Variable       | Required | Description                                                                 |
| -------------- | -------- | --------------------------------------------------------------------------- |
| `DATABASE_URL` | Yes      | Postgres connection string used by the running app                          |
| `DIRECT_URL`   | No       | Direct Postgres connection string for migrations when using pooled databases |

## Project Structure

```
src/
  app/
    [townSlug]/         # public-facing town portal
    admin/              # admin dashboard
    api/                # route handlers (upload, mapping, tooltips, etc.)
    docs/               # in-app setup + data format docs
  components/
    portal/             # public-portal components (charts, tables, tooltip)
    admin/              # admin-only components
  lib/
    parser.ts           # CSV/Excel parsing
    column-detector.ts  # auto-mapping for upload headers
    normalizer.ts       # mapping → BudgetRow normalization
    aggregator.ts       # grouping/summing helpers used by portal pages
prisma/
  schema.prisma         # data model
  migrations/           # database migration history
```

---

# Troubleshooting

**Admin registration fails on a fresh deploy** — check that `DATABASE_URL` is set in the hosting environment, then redeploy so `prisma migrate deploy` can create the tables before the app starts.

**Using Neon, Supabase, or another pooled database** — set `DATABASE_URL` to the pooled runtime URL and `DIRECT_URL` to the direct connection URL. Prisma uses `DIRECT_URL` for migrations when it is present.

**"`command not found: npm`" or "`command not found: node`"** — Node.js isn't installed or your terminal doesn't see it. Re-run the installer from <https://nodejs.org> and then **close and reopen** your terminal window before trying again.

**"Dev login failed" or 500 errors after pulling changes** — usually the configured Postgres database is out of sync with the latest data structure. Confirm `DATABASE_URL` is correct, then run `npm run dev` again so migrations can apply.

**0 rows after uploading** — check that the column you expect to be the dollar amount is mapped to **Fiscal Year Amount**, with the **Fiscal Year** field filled in. Without those, no rows are produced.

**Upload preview shows the wrong number of columns** — the parser uses the first row of the file as the column headers. Files with title rows, blank rows, or merged cells above the real headers won't parse correctly. Open the file in Excel and delete those rows before uploading.

**Port 3000 is already in use** — something else on your computer is using that address. Either close the other program or start OpenBook on a different port with `PORT=3001 npm run dev` (then open <http://localhost:3001> instead).

**The terminal closed and OpenBook stopped** — that's expected; the server only runs while the `npm run dev` terminal window is open. To restart, open a terminal, `cd` into the project folder, and run `npm run dev` again.

---

# Glossary

- **CSV** — "Comma-Separated Values." A plain-text spreadsheet format. Any spreadsheet program can save as CSV via "File → Save As."
- **Database** — a structured place where OpenBook stores your data. OpenBook uses Postgres.
- **Dependencies / packages** — small reusable pieces of code that OpenBook is built on top of. Downloaded automatically by `npm install`.
- **Git** — a tool for downloading and tracking versions of code. Optional for using OpenBook; required if you want to contribute changes.
- **localhost** — your own computer, addressed by web browsers as `http://localhost`. When you visit <http://localhost:3000>, the browser is talking to the OpenBook server running on the same machine.
- **Migration** — a recorded change to the database's structure (e.g., "add a column for funding source"). OpenBook applies these automatically when it starts.
- **Node.js** — the program that runs OpenBook's code on your computer.
- **npm** — the tool that downloads and manages OpenBook's dependencies. Installed automatically with Node.js.
- **Port** — a numbered "channel" on your computer. OpenBook uses port 3000 by default, so its web address is `localhost:3000`.
- **Repository (repo)** — the folder of code on GitHub that OpenBook lives in.
- **Slug** — a short, URL-friendly version of a name (lowercase, hyphens instead of spaces). For "Anytown, MA," the slug might be `anytown`.
- **Terminal** — the text-based window where you type commands like `npm run dev`. Called "Terminal" on macOS, "PowerShell" or "Windows Terminal" on Windows.
