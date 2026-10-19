# OpenBook Guide for Town Managers

This guide is for Town Managers, Town Administrators, Finance Directors, and Select Board members deciding whether to adopt OpenBook or overseeing its rollout. No technical knowledge is needed.

If you'll also be the one uploading the budget data, which is common in smaller towns, read this for the overview and then use the [Guide for Finance Staff](Guide-for-Finance-Staff) as your step-by-step manual.

**Contents**

- [Overview](#overview)
- [Cost](#cost)
- [Roles and responsibilities](#roles-and-responsibilities)
- [Supported data](#supported-data)
- [Data ownership](#data-ownership)
- [Resident questions](#resident-questions)
- [Web address](#web-address)
- [Getting started](#getting-started)

---

## Overview

OpenBook is a free, open-source tool that gives your town a public website where residents can explore the budget in plain language. Instead of a dense PDF, residents get charts, searchable tables, and short explanations, all built from the spreadsheets your finance office already produces.

![The public portal, showing the banner, headline figures, and sections for expenses, revenues, and capital](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/portal-overview.png)

Residents can:

- See where the town's money comes from and where it goes, by department and function
- Explore capital projects, their funding sources, and reserve balances over time
- Search line items, download the data as a spreadsheet, and print a budget book
- Read supporting documents, FAQs, and your finance office's contact email

Each page starts with the big picture and lets residents drill down to individual line items:

![The public expenses page, with summary figures, a pie chart, a multi-year trend, and a searchable table](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/portal-expenses.png)

---

## Cost

The software is free; there's no license fee. The only possible cost is hosting, the service that keeps the portal online:

- **Your town's own servers:** usually no added cost.
- **Cloud hosting:** Vercel's free tier with a free database from Neon, Supabase, or Vercel Storage can run a town portal at no cost. Paid alternatives like Railway or Render cost about $5–$25/month, well under the Chapter 30B threshold for formal procurement.
- **A `.gov` web address:** free for municipalities through [get.gov](https://get.gov).

Your IT contact will choose among these. The [Guide for IT Departments](Guide-for-IT-Departments#prerequisites-and-hosting-options) compares them.

---

## Roles and responsibilities

Getting OpenBook running involves three jobs. In a small town, one person may do more than one.

| Role | Who | Time | What they do |
| --- | --- | --- | --- |
| **Setup** | Your IT contact or a technical volunteer | A few hours, once | Hosts OpenBook, connects your web address, creates the first admin login, and hands it to the finance office. Also applies OpenBook updates once or twice a year, which takes a few minutes. |
| **Budget data** | Finance Director, Town Accountant, or Town Manager | About an hour at first, then about 20 minutes a year | Uploads the budget spreadsheet each year, adds plain-language explanations, documents, and FAQs. It's all done through web forms; no technical skill needed. |
| **Capital requests** (optional) | Department heads | As needed | Submit capital expenditure requests through an internal staff portal. The finance office reviews them in the admin panel. |

Capital requests are internal: only the finance office and the person who submitted a request can see it. They're separate from the public portal's Capital page, which shows the capital budget the finance office uploads. You can skip this feature entirely.

---

## Supported data

OpenBook uses the Excel or CSV files you can already export from UMAS or any accounting system. It can show four kinds of data:

- **Expenses:** spending by department and function area
- **Revenues:** where the money comes from
- **Capital projects:** large one-time expenditures, their purpose, and funding
- **Reserves:** stabilization funds, free cash, and other balances over time

---

## Data ownership

Your town does. Each town runs its own copy of OpenBook with its own database, on servers your town operates or on a hosting account your town owns. The team that maintains OpenBook has no access to your portal or its data.

---

## Resident questions

OpenBook doesn't collect or forward questions. It shows the contact email your finance office enters (typically something like `finance@yourtown.gov`) in the footer of every page and on the FAQ page. Residents email that address directly, so questions arrive in your normal inbox.

Publishing answers to common questions on the FAQ page cuts down on repeat emails.

---

## Web address

Most towns use a subdomain of their existing site, such as `budget.yourtown.gov`. A separate domain like `yourtownbudget.gov` also works. OpenBook can't be a page inside a site run on a platform like CivicPlus or Granicus, but a subdomain works alongside one.

Your IT contact sets up the address. The portal is public, and residents don't need to log in.

---

## Getting started

1. **Ask your IT contact to set it up** using the [Guide for IT Departments](Guide-for-IT-Departments). They'll give you a web address and an admin login.
2. **Have whoever manages the budget data set up the portal** using the [Guide for Finance Staff](Guide-for-Finance-Staff). The first upload takes 15–30 minutes, and adding explanations and documents takes another 30–60.
3. **(Optional) Invite department heads** to submit capital requests, and send them the [Guide for Department Staff](Guide-for-Department-Staff).

**Questions or problems?** [Open a GitHub issue](https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book/issues/new), or email Sarah Hubbard at [sarah_hubbard@hks.harvard.edu](mailto:sarah_hubbard@hks.harvard.edu). She's also the person to contact if you'd like to talk about using OpenBook in your town.
