# OpenBook Guide for Town Managers

This guide is written for Town Managers, Town Administrators, Finance Directors, and Select Board members who are considering or overseeing the adoption of OpenBook. You do not need any technical knowledge to read this guide.

In many towns the Town Manager or Administrator is also the person who manages the budget data and will be the one uploading it. If that's you, this guide gives you the overview, and the **[Guide for Finance Staff](Guide-for-Finance-Staff)** is your step-by-step manual for actually running the portal — plan to read both.

---

## What Is OpenBook?

OpenBook is a free, open-source tool that gives your municipality a public website where residents can explore the budget in plain language. Instead of handing residents a dense PDF spreadsheet, OpenBook turns the budget data you already produce into an interactive portal with charts, searchable tables, and plain-language explanations.

![The public portal, showing the banner, headline figures, and sections for expenses, revenues, and capital](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/portal-overview.png)

Residents can:
- See a visual overview of town spending and revenues with charts and summaries
- Browse expenses broken down by department and function
- See where the town's money comes from (property taxes, state aid, fees, etc.)
- Explore capital projects and their funding sources
- Download budget data as a spreadsheet
- Print a complete budget book
- See reserve and stabilization fund balances over time
- Access supporting documents and links your office provides
- Find your finance office's contact email if they have a question

Every page is built for someone who has never read a municipal budget. Spending opens with the big picture and lets residents drill down as far as individual line items:

![The public expenses page, with summary figures, a pie chart, a multi-year trend, and a searchable table](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/portal-expenses.png)

---

## What Does It Cost?

**The software itself is free.** OpenBook is open-source, meaning there is no license fee.

The only potential cost is **web hosting** — the server that keeps the portal running on the internet. Depending on how your town handles this:

- **If your IT department hosts it on existing town infrastructure:** Likely no additional cost.
- **If you use a cloud hosting service:** Vercel's free tier, paired with a free Postgres database from Neon, Supabase, or Vercel Storage, is enough for a town portal at no cost. Alternatives like Railway or Render run approximately $5–$20 per month — either way, well within the Chapter 30B threshold that triggers formal procurement.
- **If you use a `.gov` domain:** Free through the federal [get.gov](https://get.gov) program, which is available to municipal governments.

---

## What Does My Team Need to Do?

There are three jobs involved in getting OpenBook running. They don't have to be three different people — in a small town the Town Manager often does the second one personally, and sometimes the first too. Each job is done once, and then mostly stays out of the way.

### Role 1: Your IT Contact (One-Time Setup — A Few Hours)

Your town's IT person, or a technical volunteer, sets up the hosting and gets the portal running for the first time. This is a one-time task. Once it's done, they hand you a web address and a login, and their work is largely complete.

What IT does:
- Installs and configures OpenBook on a server or cloud hosting service
- Connects it to your town's web address (e.g., `budget.yourtown.gov`)
- Sets up the database where budget data is stored
- Creates the first admin account and hands the login to your finance office

**They do not need to be involved in day-to-day operations.**

They should, however, plan to pull in OpenBook updates once or twice a year. Your portal runs from your own copy of the software, so improvements and fixes made to the project do not reach your site until someone updates that copy. The IT guide explains how; it takes a few minutes.

### Role 2: Whoever Manages the Budget Data (Ongoing — A Few Hours Per Year)

This is usually the Finance Director, Town Accountant, or the Town Manager/Administrator themselves — whoever already owns the budget spreadsheet. That person logs into the OpenBook admin panel from any web browser and:
- Uploads the budget spreadsheet each fiscal year
- Adds plain-language explanations for budget categories
- Adds the documents residents might want (adopted budget, meeting minutes, audit reports) — either as links to files already on your website, or uploaded to OpenBook directly
- Publishes answers to common questions on the portal's FAQ page

This does not require any technical knowledge. It is a web form, similar to updating a website. The **[Guide for Finance Staff](Guide-for-Finance-Staff)** walks through every step with screenshots; if you'll be doing this yourself, that's the guide to keep open.

### Role 3: Department Heads / Staff (Optional — As Needed)

If you choose to use OpenBook's capital request feature, department heads can log in through a separate staff portal and submit capital expenditure requests directly. The finance office reviews and approves or denies them from the admin panel.

This part of OpenBook is internal. Capital requests, their amounts, and their status are visible only to your finance office and to the staff member who submitted them — never to the public. (The public portal's Capital page shows the adopted capital *budget* your finance office uploads, which is a separate thing.)

This is optional — you can use OpenBook purely as a public-facing portal without the capital request feature.

---

## What Data Does OpenBook Use?

OpenBook works with the spreadsheet files you already have. If your town uses UMAS, a financial system, or any accounting software that can export to Excel or CSV (comma-separated values), those files work directly with OpenBook.

The four types of data OpenBook can display:
1. **Expenses** — how the town spends money, by department and function area
2. **Revenues** — where the town's money comes from
3. **Capital Projects** — large one-time expenditures, their purpose, and funding sources
4. **Reserves** — stabilization funds, free cash, and other balances, shown as a trend over time

---

## Who Controls the Data?

Your town controls everything. OpenBook is self-hosted, meaning all data — the budget numbers, any uploaded documents, staff accounts — lives on a server your town operates or controls. There is no third-party company holding your data.

---

## What Happens to Resident Questions?

OpenBook doesn't collect or forward questions. The portal simply shows the contact email your finance office enters in the admin settings — typically a department address like `finance@yourtown.gov` — with a "Please contact …" note on the FAQ and Documents pages. A resident with a question emails that address directly from their own email, and it arrives in your inbox like any other message. There is no inbox inside OpenBook to check.

Your finance staff can publish answers to common questions on the portal's FAQ page, which cuts down on the same question arriving repeatedly.

---

## What Is the URL for the Portal?

Your portal's web address is flexible. Common options for Massachusetts municipalities:

- A subdomain of your existing site: `budget.yourtown.gov`
- A path on your existing site: not possible without IT vendor involvement (see IT guide)
- A new standalone domain: `yourtownbudget.gov` or `yourtown-openbook.org`

Your IT contact will set this up. The portal is publicly accessible to anyone — no login required for residents.

---

## How Long Does Setup Take?

- **IT setup:** A few hours, done once
- **First data upload:** 15–30 minutes ([Finance Staff Guide, Step 2](Guide-for-Finance-Staff#step-2--upload-your-budget-data))
- **Adding tooltips and documents:** 30–60 minutes, optional ([Steps 5–6](Guide-for-Finance-Staff#step-5--add-plain-language-explanations))

After that, the annual update — uploading the new budget each year — takes about twenty minutes ([Updating the Portal Each Year](Guide-for-Finance-Staff#updating-the-portal-each-year)).

---

## How Do I Get Started?

1. Ask your IT contact (or whoever handles your website hosting) to read the **[Guide for IT Departments](Guide-for-IT-Departments)** and begin setup. They'll come back to you with a web address and an admin login.
2. Whoever will manage the budget data — a finance staff member, or you — follows the **[Guide for Finance Staff](Guide-for-Finance-Staff)** to set up the portal and upload the first year's data. It's about an hour the first time.
3. If you want department heads to submit capital requests through OpenBook, send them the **[Guide for Department Staff](Guide-for-Department-Staff)** along with their invite link. This step is optional.

If you have questions about the software itself, the project is maintained at [github.com/Allen-Lab-for-Democracy-Renovation/Open-Book](https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book). Problems can be reported on the [GitHub Issues page](https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book/issues/new), and anyone interested in contributing — or who just wants to talk about using OpenBook in their town — can reach Sarah Hubbard at [sarah_hubbard@hks.harvard.edu](mailto:sarah_hubbard@hks.harvard.edu).
