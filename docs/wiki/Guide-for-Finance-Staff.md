# OpenBook Guide for Finance Staff

This guide is for whoever in your finance office keeps the budget portal up to date. You do not need any technical background. Everything happens in a web browser, like updating any other website.

**Start to finish, the first setup takes about an hour.** After that, updating the portal each year takes about twenty minutes.

---

## Before You Start

Your IT contact will give you two things:

- The address of your admin panel, something like `https://budget.yourtown.gov/admin/login`
- An email and password to sign in

Bookmark that address. It is where you will do everything in this guide.

You will also want your budget data exported from your accounting system as **CSV** or **Excel** files. Most systems have an "Export" or "Download" option that produces one of these. If you can open it in Excel, it will work.

---

## What the Admin Panel Looks Like

After signing in, a row of tabs runs across the top of every page:

| Tab | What it is for |
|---|---|
| **Settings** | Your town's name, color, logo, and contact email |
| **Upload** | Adding budget data from a spreadsheet |
| **Data** | Seeing what you have uploaded, and replacing or removing it |
| **Tooltips** | Plain-language explanations residents see on the portal |
| **Documents** | Links and PDFs residents can open |
| **FAQs** | Questions and answers shown on the portal |
| **Users** | Inviting department staff who submit capital requests |
| **Requests** | Reviewing capital requests those staff submit |
| **Transfer** | Handing your admin account to someone else |
| **Preview** | Opens your public portal in a new tab |

The first time through, work along the tabs in the order below. After that you will mostly use **Upload** once a year.

---

## Step 1 — Fill In Your Town Settings

Go to **Settings**.

![The Settings tab, with fields for town name, brand color, logo, contact email, and a description of the portal](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/admin-settings.png)

There are five things to fill in:

**Town Name** — how your municipality should appear on the portal, for example `Riverton`. Enter just the name; the portal adds words like "Town of" where it needs them, and this way it reads correctly for a city or district too. Correcting the name later is safe: your portal's web address is set when the portal is first created and does not change, so existing links keep working.

**Brand Color** — click the color square to pick a color, or type a hex code like `#1e5b4f`. This colors the banner, buttons, and charts. Your town's official color makes the portal look like it belongs to you.

**Town Logo** — click **Choose File** and pick your seal or logo. PNG, JPEG, or WebP, up to 10 MB. Large images are shrunk for you, so do not worry about the size of the original. The logo appears in the top-left corner of every page, next to your town name.

**Contact Email** — where residents should send budget questions. This is shown publicly, so use a department address like `finance@yourtown.gov`, not a personal one.

**About This Portal** — one or two sentences telling residents what this site is. For example: *"Riverton's budget portal lets residents explore how the town raises and spends money each fiscal year."*

Click **Save Settings**. Changes appear on the public portal right away.

---

## Step 2 — Upload Your Budget Data

Go to **Upload**. You will repeat this step once for each kind of data you have.

![The Upload tab, showing the three-step explanation and the category dropdown](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/admin-upload.png)

### 2a. Pick what you are uploading

Choose one from the dropdown:

- **Expenses** — how the town spends money
- **Revenues** — where the town's money comes from
- **Capital Projects** — large one-time purchases and construction
- **Reserves** — stabilization funds, free cash, and other balances

A sample table appears showing roughly what that file should contain. **Your column names do not have to match it.** You will connect your columns to OpenBook's in the next step.

### 2b. Add your file

Drag your file onto the upload box, or click to browse for it. CSV or Excel, up to 10 MB.

OpenBook reads the file and tells you how many rows and columns it found, with a preview of the first two rows so you can confirm it read the right file.

> **If you get an error here,** it is almost always one of three things: the spreadsheet has a title row above the column headers (delete that row in Excel and save again), the file is not a `.csv` or `.xlsx`, or the file is over 10 MB.

### 2c. Confirm the columns

![The column mapping step, with each spreadsheet column matched to an OpenBook field](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/admin-column-mapping.png)

OpenBook reads your column headers and guesses what each one is. Anything it matched on its own is marked **Auto** in green. A green box at the top lists which columns this kind of data actually needs.

Go down the list and check each dropdown. If a guess is wrong, change it. If a column is not needed, choose **Skip this column**.

**Every column of dollar amounts needs two more things:**

1. **Fiscal Year** — type the year, like `2026`
2. **Type** — choose **Budget** (planned) or **Actual** (already spent)

This is what keeps planned and actual money separate on the portal, so the two are never added together. A column named `FY2025 Budget` and one named `FY2025 Actual` stay in their own columns for residents.

If something required is still missing, a yellow box tells you what before you can continue.

When the warnings are gone, click **Confirm & Save Data**.

> **Tip:** Upload one file at a time. Do expenses first, then come back for revenues, and so on. Each kind of data stands on its own.

---

## Step 3 — Check What You Uploaded

Go to **Data**.

![The Data tab listing each uploaded file with its category, row count, and status](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/admin-data.png)

Every file you have uploaded is listed with its category, row count, and date. **Mapped** in green means the data saved correctly.

From here you can **Replace** a file (removes the old version and takes you back to Upload), **Delete** one upload, or **Delete All Data** and start over.

> **Careful:** deleting takes that data off the public portal immediately. If your portal is already live, residents stop seeing it until you upload a replacement.

---

## Step 4 — Look at Your Portal

Click **Preview** in the top bar. Your public portal opens in a new tab, exactly as residents see it.

![The public portal overview page, with the banner, at-a-glance figures, and sections for expenses, revenues, and capital](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/portal-overview.png)

Check that the totals look about right, that your name, color, and logo are correct, and that each kind of data you uploaded is showing. Then switch back to the admin tab to fix anything that looks off.

Residents get a page for each kind of data. Expenses, for instance, opens with the big picture and a searchable table underneath:

![The public expenses page, with summary tiles, a pie chart, a multi-year trend chart, and a detailed table](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/portal-expenses.png)

---

## Step 5 — Add Plain-Language Explanations

Go to **Tooltips**. This is optional, and it is the single most useful thing you can do for residents.

![The Tooltips tab, with a dropdown of budget categories and a box for the explanation](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/admin-tooltips.png)

A tooltip is a short explanation that appears when someone hovers over or taps a budget category. A small `?` marks anything that has one.

**Category explainers** cover broad groupings like "Public Safety" or "Employee Benefits":

1. Pick a category from the dropdown
2. Write one or two sentences in everyday language
3. Click **Save**

Categories that already have an explanation are marked with a `●`.

> **Example.** For "Employee Benefits": *"Town-wide costs like health insurance and retirement assessments that are not charged to a single department."*

**Line item hover text** works the same way, for individual rows like "Cherry Sheet Assessments."

To remove a tooltip, clear the box and save.

Keep them short. One or two sentences get read; a paragraph does not. Write for someone who has never seen a municipal budget — the jargon you use every day is exactly what needs explaining.

---

## Step 6 — Add Documents and Links

Go to **Documents**. This one tab holds everything on your portal's public Documents & Resources page: links to files elsewhere, and PDFs you upload here.

![The Documents tab, with the add-a-link form above the upload-a-PDF form, and everything already added listed below](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/admin-documents.png)

### Which one should you use?

**Link to it whenever the document is already on your website.** There is no size limit, and residents always get the current version instead of a copy that goes stale here. **Upload a PDF** only when a document is not online anywhere yet.

Both forms are on the page, one under the other. Use whichever fits.

### Adding a link

1. Enter a **Title** — what residents will click, like `FY2026 Adopted Budget`
2. Enter the **URL**, starting with `https://`
3. Add a **Description** if it helps — one line saying what the document is
4. Pick a **Category**
5. Click **Add Link**

### Uploading a PDF

1. Drag the file onto the upload box, or click **browse to select**
2. Add a **Display Title** if you want something other than the file name
3. Add a **Description** if it helps
4. Pick a **Category**
5. Click **Upload PDF**

Maximum size is 10 MB. If a file is larger, OpenBook tells you before it uploads. Either shrink the PDF (the "reduce file size" or "optimize" option in Acrobat or Preview usually does it) or put it on your website and add it as a link.

### Changing what you have added

Everything is listed under **On Your Portal**, grouped by category the same way residents see it, each marked as a link or a PDF. **Edit** changes a link, including its **Sort Order** if you want it higher or lower in its category. **Delete** removes it. **Open** and **View** show you the document itself.

Here is how it reaches residents:

![The public Documents & Resources page, with links and PDFs grouped by category](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/portal-documents.png)

---

## Answering Resident Questions

Residents' questions go straight to the Contact Email you set in Settings, so they arrive in your inbox like any other email.

The **FAQs** tab is where you publish questions and answers on the portal itself. If the same question keeps arriving, answering it there saves you replying again.

---

## Reviewing Capital Requests from Departments

Skip this section unless your town uses the staff portal.

Department heads can sign in separately and submit capital requests. They appear in the **Requests** tab with the department, purpose, amount, who submitted it, and the date.

Click any row to open it and read the full description, justification, and proposed funding source. Then optionally type **Admin Notes** (the staff member sees these) and choose **Approve**, **Deny**, or **Under Review**. They see the change the next time they sign in.

To invite department staff, use the **Users** tab: enter their email, click **Create Invite**, and send them the link that gets copied to your clipboard. Each link works once.

---

## Handing Over to Someone Else

Go to **Transfer** when you are leaving the role.

Enter the new person's name, email, and a password for them (at least 8 characters), then click **Transfer Account** and confirm.

> **This cannot be undone.** Your account is deleted and theirs is created. Give them the email and password before you confirm, and have them sign in and change the password.

---

## Updating the Portal Each Year

Once a year, when the new budget is adopted:

1. Export the new data from your accounting system
2. Go to **Upload** and upload each file, the same way as the first time
3. Go to **Preview** and check it over
4. Look at your **Tooltips** if any category names changed

**Keep the previous years.** You do not have to delete anything. When the portal has more than one year, it shows year-over-year comparisons and trend charts automatically, which is most of what residents want to know.

---

## A Few Things Worth Knowing

- **Upload several years if you have them.** Trend charts and change columns appear on their own once there is more than one year of data.
- **Check it on your phone.** Many residents will. Open Preview on your phone and scroll through.
- **Nothing is public until you publish.** Take your time getting it right.
- **The Budget Book tab prints.** It assembles your data into a formatted document you can print or save as a PDF for meetings, and it can include the prior year with the change from year to year.

![The Budget Book view, a printable summary of the budget](https://raw.githubusercontent.com/Allen-Lab-for-Democracy-Renovation/Open-Book/main/docs/screenshots/portal-budget-book.png)
