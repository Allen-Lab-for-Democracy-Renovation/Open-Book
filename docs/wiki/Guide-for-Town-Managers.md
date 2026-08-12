# OpenBook Guide for Town Managers

This guide is written for Town Managers, Town Administrators, Finance Directors, and Select Board members who are considering or overseeing the adoption of OpenBook. You do not need any technical knowledge to read this guide.

---

## What Is OpenBook?

OpenBook is a free, open-source tool that gives your town a public website where residents can explore the town budget in plain language. Instead of handing residents a dense PDF spreadsheet, OpenBook turns your existing budget data into an interactive portal with charts, searchable tables, and plain-language explanations.

Residents can:
- See a visual overview of town spending and revenues with charts and summaries
- Browse expenses broken down by department and function
- See where the town's money comes from (property taxes, state aid, fees, etc.)
- Explore capital projects and their funding sources
- Download budget data as a spreadsheet
- Print a complete budget book
- Access supporting documents and links your office provides
- Send questions directly to your finance office

---

## What Does It Cost?

**The software itself is free.** OpenBook is open-source, meaning there is no license fee.

The only potential cost is **web hosting** — the server that keeps the portal running on the internet. Depending on how your town handles this:

- **If your IT department hosts it on existing town infrastructure:** Likely no additional cost.
- **If you use a cloud hosting service like Railway or Render:** Approximately $5–$20 per month, well within the Chapter 30B threshold that triggers formal procurement.
- **If you use a `.gov` domain:** Free through the federal [get.gov](https://get.gov) program, which is available to municipal governments.

---

## What Does My Team Need to Do?

There are three people (or roles) involved in getting OpenBook running. Each one does their part once, and then mostly stays out of the way.

### Role 1: Your IT Contact (One-Time Setup — A Few Hours)

Your town's IT person, or a technical volunteer, sets up the hosting and gets the portal running for the first time. This is a one-time task. Once it's done, they hand you a web address and a login, and their work is largely complete.

What IT does:
- Installs and configures OpenBook on a server or cloud hosting service
- Connects it to your town's web address (e.g., `budget.yourtown.gov`)
- Sets up the database where budget data is stored
- Creates the first admin account and hands the login to your finance office

**They do not need to be involved in day-to-day operations.**

### Role 2: Finance Office / Budget Staff (Ongoing — A Few Hours Per Year)

The person in your finance office who manages the budget data logs into the OpenBook admin panel from any web browser and:
- Uploads the budget spreadsheet each fiscal year
- Adds plain-language explanations for budget categories
- Uploads PDF documents residents might want (adopted budget, meeting minutes, audit reports)
- Adds links to relevant external resources
- Responds to questions residents submit through the portal

This does not require any technical knowledge. It is a web form, similar to updating a website.

### Role 3: Department Heads / Staff (Optional — As Needed)

If you choose to use OpenBook's capital request feature, department heads can log in through a separate staff portal and submit capital expenditure requests directly. The finance office reviews and approves or denies them from the admin panel.

This is optional — you can use OpenBook purely as a public-facing portal without the capital request feature.

---

## What Data Does OpenBook Use?

OpenBook works with the spreadsheet files you already have. If your town uses UMAS, a financial system, or any accounting software that can export to Excel or CSV (comma-separated values), those files work directly with OpenBook.

The four types of data OpenBook can display:
1. **Expenses** — how the town spends money, by department and function area
2. **Revenues** — where the town's money comes from
3. **Capital Projects** — large one-time expenditures, their purpose, and funding sources
4. **Reserves** — stabilization funds and free cash (stored but not yet displayed publicly)

---

## Who Controls the Data?

Your town controls everything. OpenBook is self-hosted, meaning all data — the budget numbers, any uploaded documents, resident questions — lives on a server your town operates or controls. There is no third-party company holding your data.

---

## What Happens to Resident Questions?

When a resident uses the "Ask a Question" feature on the public portal, they are directed to email your town's finance office directly using the contact email you provide. You set that email address in the admin settings.

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
- **First data upload:** 15–30 minutes
- **Adding tooltips and documents:** 30–60 minutes, optional

After that, your annual update (uploading the new budget each year) takes about 15–30 minutes.

---

## How Do I Get Started?

Share this wiki with your IT contact and your finance office staff. Ask your IT contact to read the **IT Department Guide** and begin setup. Once they hand you a login, your finance office staff can follow the **Finance Staff Guide** to set up the portal and upload data.

If you have questions about the software itself, the project is maintained at [github.com/Allen-Lab-for-Democracy-Renovation/Open-Book](https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book).
