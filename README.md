# OpenBook

A municipal budget transparency platform. OpenBook lets towns publish their budgets online so residents can explore expenses, revenues, and capital projects in plain language.

![Homepage](docs/screenshots/homepage.png)

## Town Budget Portal

Each town gets a branded portal with tabbed navigation across budget categories, summary tiles, interactive charts, searchable line-item tables, exportable data, and a printable budget book.

![Town Portal](docs/screenshots/town-portal.png)

## Admin Dashboard

Town administrators upload budget data (CSV or Excel), customize portal branding, add plain-language tooltips for budget items, manage supporting documents, and respond to resident questions.

![Admin](docs/screenshots/admin-upload.png)

## Getting Started

### Prerequisites

- Node.js 18+ (20 LTS recommended)
- npm 9+

### 1. Install and start

```bash
npm install
npm run dev
```

That's it. `npm install` generates the Prisma client, and `npm run dev` automatically creates the SQLite database and applies all migrations before starting the server. No `.env` file is required for local development — `DATABASE_URL` defaults to `file:./dev.db`.

Open [http://localhost:3000](http://localhost:3000).

Optionally seed sample data so the portal isn't empty on first boot:

```bash
npm run seed
```

## Setting Up Your Portal

Once the dev server is running, walk through the admin flow in order. Each step is a tab in the admin header.

### 1. Create an admin account

Visit `/admin/register` to create the first admin account — the first person to register automatically becomes the admin. After that, registration is locked unless an admin is logged in. Sign in at `/admin/login`.

### 2. Configure your town (Settings tab)

Go to `/admin/setup` to set:

- **Town name and slug** — the slug becomes the URL (`/your-town-slug`)
- **Primary color** — colors chart accent and links on the public portal
- **Logo** — shown as tab icon and on page
- **Contact email** — where you want resident questions to be sent to
- **About text** — appears on the portal homepage

### 3. Upload budget data (Upload tab)

The upload flow has three steps:

1. **Pick a category** — Expenses, Revenues, Capital Projects, or Reserves. A sample table preview appears so you can see what shape the file should take.
2. **Drop in a CSV or Excel file** — up to 10 MB. After upload, you'll see a small preview of the first two rows.
3. **Map your columns** — OpenBook auto-detects common header patterns (e.g. `FY2026 Budget`, `Department`). Anything ambiguous you label manually. If you are missing required categories, you must add them before savinging and uploading your data. Check the warnings to see what you might be missing!

Each category has its own required fields:

| Category         | Required mappings                                                     |
| ---------------- | --------------------------------------------------------------------- |
| Expenses         | Function Area, Fiscal Year Amount (with at least one set to "Budget") |
| Revenues         | Category, Fiscal Year Amount (with at least one set to "Budget")      |
| Capital Projects | Department, Purpose, Funding Source, Fiscal Year Amount               |
| Reserves         | (no public page yet — data is stored but not rendered)                |

Examples of ideal data formats can be found in the repository, under sample-data

Sample Data (Capital)
![Capital](docs/screenshots/sample-data-capital.png)

Sample Data (Revenue)
![Revenue](docs/screenshots/sample-data-revenue.png)

### 4. Manage existing data (Data tab)

`/admin/data` lists every upload with its category, row count, status, and date. From here you can delete an upload (and all its rows) or wipe everything to start over. Use **Upload New Data** to add another file alongside what's already there — different categories live independently.

### 5. Polish the portal

Once data is uploaded, several optional features make the portal more useful for residents:

- **Tooltips** (`/admin/tooltips`) — hover-text explanations attached to budget categories or line items. A `?` icon appears next to any category or line item that has a tooltip on the public portal. It is generally recommended that these tooltips contain short, non-essential information.
- **Links** (`/admin/links`) — supporting external links (e.g. town meeting warrants, audit reports) that show on the portal.
- **PDFs** (`/admin/documents`) — uploadable PDF documents (annual reports, fee schedules, etc.).
- **FAQs** (`/admin/faqs`) — manage frequently asked questions that appear on the public portal's FAQ tab.
- **Requests** (`/admin/requests`) — review and approve capital expenditure requests that staff submit via `/staff`.
- **Transfer** (`/admin/transfer`) — export/import town data for moving between environments.

### 6. Preview the public site

The admin header has a **Preview** link that opens your public portal (`/[townSlug]`) in a new tab so you can see what residents will see while you're still editing.

## Features

### For residents

- Budget overview with year-over-year comparisons
- Expense and revenue breakdowns by department and function (pie charts, stacked trend bars)
- Capital project listings with funding sources
- Searchable line-item tables with CSV export
- Printable budget book generation
- FAQ page with expandable answers and direct email link to the town's finance office
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

This section is for municipal IT staff deploying OpenBook for their town. You should be comfortable with a command line, but you do not need to write code.

### Hosting Options

**Option A: Vercel (recommended for simplicity)**

1. Create a free account at [vercel.com](https://vercel.com)
2. Fork or clone this repository to your town's GitHub account
3. In Vercel, click **Add New Project** and import the repository
4. Set the `DATABASE_URL` environment variable to `file:./dev.db`
5. Click **Deploy**

Vercel gives you a URL like `openbook-abc123.vercel.app`. You can connect a custom domain afterward.

**Option B: Self-hosted server**

Any server with Node.js 20+ works. Clone the repo, then:

```bash
npm install
npm run build
npm start
```

The app runs on port 3000. Place it behind a reverse proxy (nginx, Apache, Caddy) for SSL on port 443. Use `pm2` to keep it running:

```bash
npm install -g pm2
pm2 start "npm start" --name openbook
pm2 save
pm2 startup
```

**Option C: Railway or Render**

Both are cloud platforms that run Node.js apps with minimal config. Set `DATABASE_URL=file:./dev.db` as an environment variable, and configure:
- Build command: `npm install && npm run build`
- Start command: `npm start`

Attach a persistent volume mounted at the `prisma/` directory so the database survives restarts.

### Custom Domain Setup

Create a subdomain like `budget.yourtown.gov`:

1. Add a **CNAME record** in your DNS provider pointing to your hosting platform's URL
2. Add the custom domain in your platform's settings (Vercel: Settings → Domains; Railway/Render: similar)
3. SSL certificates are provisioned automatically on all three platforms

For self-hosted servers, use Certbot for a free SSL certificate:

```bash
sudo certbot --nginx -d budget.yourtown.gov
```

### First Admin Account

Navigate to `/admin/register`. Enter a name, email, and password. The first person to register becomes the admin — after that, this page is locked. Additional admin access is managed through the **Transfer** tab.

### User Management

**Staff invites:** Admins invite staff from the **Users** tab by entering an email address. A unique single-use invite link is generated and copied to the clipboard. Send it to the staff member however you prefer. They click it, fill in their name/department/password, and their account is created. Staff cannot self-register.

**Email domain restrictions:** Optionally restrict invites to specific email domains (e.g. `yourtown.gov`) from the Users tab.

**Password resets:** If a staff member forgets their password, generate a one-time reset link from the Users tab.

### Security

- Passwords are hashed with scrypt (never stored in plaintext)
- Sessions use HTTP-only cookies with 7-day expiration
- Staff registration requires a single-use invite token from an admin
- No external services or third-party APIs — all data stays on your server

### Backups

The database is a single SQLite file (`dev.db`). Back it up by copying the file:

```bash
cp dev.db dev.db.backup-$(date +%Y%m%d)
```

### Updating

For Vercel: push to your GitHub repo and it redeploys automatically.

For self-hosted:

```bash
git pull origin main
npm install
npm run build
pm2 restart openbook
```

Database migrations run automatically during the build step.

### Troubleshooting

- **Database errors after updating:** Run `npx prisma migrate deploy` manually, then restart.
- **Staff member can't log in:** Check the Users tab — create a new invite or reset their password.
- **Transfer admin access:** Use the Transfer tab in the admin panel — no IT involvement needed.

For the full step-by-step guide with additional detail, see the [GitHub Wiki](https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book/wiki/Guide-for-IT-Departments).

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: SQLite via Prisma 7 with the better-sqlite3 adapter
- **Styling**: Tailwind CSS v4
- **Charts**: Chart.js + react-chartjs-2
- **Data import**: PapaParse (CSV), SheetJS (Excel)
- **Auth**: scrypt-hashed passwords, HTTP-only session cookies

## Environment Variables

| Variable       | Required | Description                                                            |
| -------------- | -------- | ---------------------------------------------------------------------- |
| `DATABASE_URL` | No       | SQLite database file path (defaults to `file:./dev.db` if not set)     |

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

## Troubleshooting

**"Dev login failed" or 500 errors after pulling changes** — usually the local DB is out of sync with the schema. Delete `dev.db` and run `npm run dev` again — the database will be recreated automatically from the migrations.

**0 rows after uploading** — check that the column you expect to be the dollar amount is mapped to **Fiscal Year Amount**, with the **Fiscal Year** field filled in. Without those, rows can't be produced.

**Upload preview shows the wrong number of columns** — the parser uses the first row as headers. Files with title rows or blank rows above the headers won't parse correctly; trim them in your spreadsheet first.
