# OpenBook Guide for Finance Staff

This guide is for whoever keeps the budget portal up to date: a Finance Director, Town Accountant, or Town Manager. Everything happens in a web browser, and no technical background is needed. For an overview of what OpenBook is and what it costs, see the [Guide for Town Managers](Guide-for-Town-Managers).

The first setup takes about an hour. After that, the yearly update takes about 20 minutes.

**Contents**

- [Prerequisites](#prerequisites)
- [Admin panel overview](#admin-panel-overview)
- [Step 1: Town settings](#step-1-town-settings)
- [Step 2: Budget data upload](#step-2-budget-data-upload)
- [Step 3: Upload review](#step-3-upload-review)
- [Step 4: Portal preview](#step-4-portal-preview)
- [Step 5: Tooltips](#step-5-tooltips)
- [Step 6: Documents and links](#step-6-documents-and-links)
- [Step 7: FAQs](#step-7-faqs)
- [Capital requests](#capital-requests)
- [Annual updates](#annual-updates)
- [Account transfer](#account-transfer)
- [Best practices](#best-practices)
- [Support](#support)

---

## Prerequisites

You need:

- **Your admin login** from your IT contact: an address like `https://budget.yourtown.gov/admin/login`, plus an email and password. Bookmark the address.
- **Your budget data as CSV or Excel files**, exported from your accounting system. If it opens in Excel, it will work.

---

## Admin panel overview

After you sign in, tabs run across the top of every page:

| Tab | Use it to… |
| --- | --- |
| **Settings** | Set your town's name, color, logo, and contact email |
| **Upload** | Add budget data from a spreadsheet |
| **Data** | Review, download, replace, or delete uploads |
| **Tooltips** | Write plain-language explanations of budget items |
| **Documents** | Add links and PDFs |
| **FAQs** | Write questions and answers for residents |
| **Users** | Invite department staff *(internal)* |
| **Requests** | Review staff capital requests *(internal)* |
| **Transfer** | Hand your admin account to someone else *(internal)* |
| **Preview** | Open your public portal in a new tab |

Residents never see anything in the *internal* tabs. Everything else appears on the public portal.

The first time through, follow the steps below in order.

---

## Step 1: Town settings

Go to **Settings**.

![The Settings tab, with fields for town name, brand color, logo, contact email, and a description of the portal](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/admin-settings.png)

- **Town Name:** how your town appears on the portal, e.g. `Riverton`. Your first save sets the portal's web address from this name (e.g. `/riverton`). That address never changes, so you can correct the name later without breaking links.
- **Brand Color:** pick a color or type a hex code like `#1e5b4f`. It's used for the banner, buttons, and charts.
- **Town Logo:** your seal or logo, as PNG, JPEG, or WebP up to 10 MB. Large images are resized automatically. It appears next to the town name on every page.
- **Contact Email:** where residents send questions. It appears in every page's footer and on the FAQ page, so use a department address like `finance@yourtown.gov`.
- **About This Portal:** one or two sentences telling residents what the site is.

Click **Save Settings**. Changes appear on the portal right away. Until you upload data, the portal shows a "being set up" message.

---

## Step 2: Budget data upload

Go to **Upload**. Upload one file at a time, repeating this step for each kind of data you have.

![The Upload tab, showing the three-step explanation and the category dropdown](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/admin-upload.png)

**1. Choose a category:** Expenses, Revenues, Capital Projects, or Reserves. A sample table shows the kind of data expected. Your column names don't need to match it.

**2. Add your file.** Drag it onto the box or click to browse. It must be a `.csv` or `.xlsx` file, up to 10 MB. OpenBook shows how many rows and columns it found, plus a preview of the first two rows.

The first row of the file must be the column headers. If you get an error or the columns look wrong, delete any title rows, blank rows, or totals above the headers in Excel, then upload again.

**3. Map the columns.** OpenBook guesses what each of your columns is and marks confident guesses **Auto**. A box at the top lists the columns this category needs. Check each dropdown, fix wrong guesses, and choose **Skip this column** for anything you don't need.

![The column mapping step, with each spreadsheet column matched to an OpenBook field](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/admin-column-mapping.png)

Each column of dollar amounts also needs:

- **Fiscal Year:** e.g. `2026`
- **Type:** **Budget** (planned), **Actual** (spent), or **Balance** (for reserves)

This keeps planned and actual amounts separate on the portal, so `FY2025 Budget` and `FY2025 Actual` are never added together.

If anything required is missing, a warning lists it. Once the warnings are resolved, click **Confirm & Save Data**. The data appears on the public portal immediately; there's no separate publish step.

If the file covers a fiscal year that already has data in that category, OpenBook asks before replacing the existing rows.

For details on accepted spreadsheet layouts, see [DATA-FORMAT.md](https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book/blob/main/DATA-FORMAT.md).

---

## Step 3: Upload review

Go to **Data**.

![The Data tab listing each uploaded file with its category, row count, and status](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/admin-data.png)

Each upload is listed with its category, row count, status, and date:

- **mapped** (green): saved and showing on the portal.
- **uploaded** (yellow): the file was received, but the column mapping wasn't finished, so none of its rows are on the portal. Upload it again, or delete it.

For each upload you can **Download** the saved data as a spreadsheet, **Replace** it (this deletes it and opens Upload so you can redo it), or **Delete** it. **Delete All Data** at the bottom starts over. Deleting removes that data from the public portal immediately.

The box at the top shows how much database space your data uses.

---

## Step 4: Portal preview

Click **Preview** in the top bar to open the public portal in a new tab.

![The public portal overview page, with the banner, at-a-glance figures, and sections for expenses, revenues, and capital](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/portal-overview.png)

Check that the totals look right, that your name, color, and logo are correct, and that each category you uploaded appears. Each category gets its own page, with charts and a searchable table:

![The public expenses page, with summary tiles, a pie chart, a multi-year trend chart, and a detailed table](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/portal-expenses.png)

---

## Step 5: Tooltips

Go to **Tooltips**. This step is optional, but it's the most helpful thing you can add for residents. A tooltip is a short explanation that appears when a resident taps or hovers over the `?` next to a budget item.

![The Tooltips tab, with a dropdown of budget categories and a box for the explanation](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/admin-tooltips.png)

1. Under **Category Explainers** (e.g. "Public Safety") or **Line Item Hover Text** (e.g. "Cherry Sheet Assessments"), choose an item.
2. Write one or two sentences in everyday language.
3. Click **Save**.

Items that already have a tooltip are marked `●`. To remove one, clear the text and save.

Write for someone who has never read a municipal budget. For example, for "Employee Benefits": *"Town-wide costs like health insurance and retirement assessments that aren't charged to a single department."*

---

## Step 6: Documents and links

Go to **Documents**. Everything here appears on the portal's Documents page, grouped by category.

![The Documents tab, with the add-a-link form above the upload-a-PDF form, and everything already added listed below](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/admin-documents.png)

If a document is already on your town's website, add a link to it, so residents always get the current version. Upload a PDF only if the document isn't online anywhere.

- **Add a link:** enter a **Title**, a **URL** starting with `https://`, an optional **Description**, and a **Category**, then click **Add Link**.
- **Upload a PDF:** drag in the file (up to 10 MB), and optionally add a **Display Title** and **Description**. Choose a **Category**, then click **Upload PDF**. If a PDF is too large, reduce its size in Acrobat or Preview, or post it on your website and link to it.

Everything you've added is listed under **On Your Portal**. Links can be edited, including their **Sort Order** within a category. PDFs can only be deleted and re-uploaded.

![The public Documents & Resources page, with links and PDFs grouped by category](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/portal-documents.png)

---

## Step 7: FAQs

Go to **FAQs**. Enter a **Question** and **Answer**, then click **Add FAQ**. Use the arrows to reorder them, or **Edit** and **Delete** existing ones.

OpenBook doesn't receive resident questions. Residents email the contact address from Settings directly, so answering common questions here cuts down on repeat emails.

---

## Capital requests

Skip this section if your town doesn't use the staff portal. Everything here is internal: residents never see requests, amounts, notes, or statuses. This is separate from the public **Capital** page, which shows only the capital projects you upload in Step 2.

**Invite staff (Users tab).** Enter a staff member's email and click **Create Invite**. A single-use link is copied to your clipboard; send it to them yourself, because OpenBook doesn't email it. From the same tab you can:

- **Restrict invites** to certain email domains (e.g. `yourtown.gov`) under **Allowed Email Domains**.
- **Reset Password:** copies a single-use reset link for you to send.
- **Remove** an account. Their past requests remain, marked "Removed user."

Point new staff to the [Guide for Department Staff](Guide-for-Department-Staff).

**Review requests (Requests tab).** Click a request to see its full details. Optionally add **Admin Notes**, which the staff member can see, then choose **Approve**, **Recommend**, **Deny**, or **Under Review**. Use **Recommend** when you're putting a request forward to the Select Board or Town Meeting without a final decision.

---

## Annual updates

When the new budget is adopted:

1. Export the new data from your accounting system.
2. Upload each file under **Upload**, the same way as the first time.
3. Check the result with **Preview**.
4. Update **Tooltips** if any category names changed.

Keep previous years' data. With more than one year uploaded, the portal shows year-over-year comparisons and trend charts automatically.

---

## Account transfer

When you leave the role, go to **Transfer**. Enter the new person's name, email, and a password (at least 8 characters), then click **Transfer Account** and confirm. This creates their account and permanently deletes yours, while keeping all portal data. Give them the password securely; OpenBook has no option to change it later.

---

## Best practices

- **Upload several years if you have them.** Trend charts and change columns appear once there's more than one year.
- **Check the portal on your phone.** Many residents will view it that way.
- **Print a budget book.** The portal's **Budget Book** tab formats your data for printing or saving as a PDF, with an optional prior-year comparison.

![The Budget Book view, a printable summary of the budget](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/portal-budget-book.png)

---

## Support

[Open a GitHub issue](https://github.com/Allen-Lab-for-Democracy-Renovation/Open-Book/issues/new) describing what you were doing, what happened, and the page you were on. A screenshot helps, but crop out anything private. Or email Sarah Hubbard at [sarah_hubbard@hks.harvard.edu](mailto:sarah_hubbard@hks.harvard.edu).
