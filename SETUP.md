# OpenBook Self-Hosting Guide

OpenBook is a self-hosted municipal budget transparency portal. Each town deploys its own instance.

## Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- npm 9+

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-org/openbook.git
cd openbook
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the example environment file and edit it:

```bash
cp .env.example .env
```

Set these values in `.env`:

```env
DATABASE_URL="file:./dev.db"
SETUP_KEY="your-secret-setup-key"
```

- `DATABASE_URL`: Path to your SQLite database file. The default works for local development.
- `SETUP_KEY`: A secret key required to create the first admin account. Choose something random and secure. Share it only with people who should be able to create admin accounts.

### 4. Run database migrations

```bash
npx prisma migrate dev
```

This creates the SQLite database and applies all schema migrations.

### 5. Start the development server

```bash
npm run dev
```

Visit `http://localhost:3000/admin/register` to create your admin account using the setup key.

## First-Time Setup

1. Go to `/admin/register` and create an admin account (requires your `SETUP_KEY`).
2. After logging in, go to `/admin/setup` to configure your town (name, slug, color, contact email).
3. Go to `/admin/upload` to upload your budget CSV or Excel files.
4. Map columns and confirm. Your portal is now live at `/{your-town-slug}`.

## Production Deployment

### Vercel

1. Fork this repository
2. Import the project in Vercel
3. Set environment variables (`DATABASE_URL`, `SETUP_KEY`)
4. Deploy

Note: SQLite works for single-instance deployments. For Vercel, the database file must be in a persistent storage location. Consider using Vercel's Blob storage or switching to PostgreSQL for production.

### VPS / Docker

```bash
# Build for production
npm run build

# Start the production server
npm start
```

The app runs on port 3000 by default. Use a reverse proxy (nginx, Caddy) for HTTPS.

### Custom Domain

For municipal deployments, we recommend a `.gov` subdomain:

1. Set up a CNAME record: `budget.yourtown.gov` -> your deployment host
2. Configure HTTPS via your reverse proxy or hosting platform
3. Update the portal's URL slug to match your subdomain expectations

## Environment Variables

| Variable      | Required | Description                                    |
|---------------|----------|------------------------------------------------|
| DATABASE_URL  | Yes      | SQLite database file path                      |
| SETUP_KEY     | Yes      | Secret key for creating admin accounts         |

## Seeding Sample Data

To load sample data for testing:

```bash
npm run seed
```

This loads the sample CSV files from `sample-data/` into the database.

## Troubleshooting

**"Invalid setup key" when registering**: Make sure `SETUP_KEY` is set in your `.env` file and matches what you enter in the registration form.

**Database errors**: Try deleting `dev.db` and running `npx prisma migrate dev` again. This resets the database.

**Port conflicts**: Use `npm run dev -- --port 3001` to run on a different port.
