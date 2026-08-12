# OpenBook Guide for Finance Staff

This guide is for the person in your town's finance office who manages the OpenBook admin panel. You do not need any technical knowledge. Everything is done through a web browser, just like updating any other website.

---

## Getting Started

Your IT contact will give you:
- The web address for your admin panel (e.g., `https://budget.yourtown.gov/admin/login`)
- An email address and password to log in

Bookmark the admin panel address. You will return to it whenever you need to update the portal.

---

## The Admin Panel At a Glance

After logging in, you will see a navigation bar at the top of the page with these tabs:

| Tab | What It Does |
|---|---|
| **Settings** | Set up your town's name, colors, logo, and contact info |
| **Upload** | Add budget data from a spreadsheet file |
| **Data** | View, replace, or delete uploaded files |
| **Tooltips** | Add plain-language explanations for budget categories and line items |
| **Links** | Add links to external resources (meeting minutes, reports, etc.) |
| **PDFs** | Upload PDF documents residents can download |
| **Questions** | View questions residents have submitted through the portal |
| **Requests** | Review capital expenditure requests submitted by department staff |
| **Transfer** | Hand admin access to a new person |
| **Preview** | Open your public portal in a new tab to see what residents see |

Work through these tabs in order the first time. After that, you will mostly use **Upload** once a year and the other tabs as needed.

---

## Step 1 — Configure Your Town Settings

Go to the **Settings** tab.

Fill in each field:

**Town Name**
Type the full name of your town as you want it to appear on the public portal. Example: `Town of Sutton`. The URL slug (the web address for your portal) is created automatically from this name, but you can edit it.

**URL Slug**
This is the last part of your portal's web address. If your slug is `sutton`, your portal will be at `budget.yourtown.gov/sutton`. It is auto-generated from your town name. Use only lowercase letters and dashes — no spaces or symbols.

**Brand Color**
Click the color swatch to open a color picker, or type a hex color code (like `#1e3a5f`). This color appears on charts and links throughout your public portal. We recommend using your town's official color.

**Town Logo**
Click **Choose File** and select your town seal or logo from your computer. Accepted formats: PNG, JPEG, or WebP. Maximum file size: 5 MB. The logo appears as the browser tab icon and on pages of your portal.

**Contact Email**
Enter the email address where residents should send budget questions. This is displayed publicly on your portal. Use a department address, not a personal one, such as `finance@yourtown.gov`.

**About This Portal**
Write one or two sentences describing the portal for residents. This appears on your portal's main page. Example: *"Sutton's budget transparency portal lets residents explore how the town spends and collects money each fiscal year."*

When you are finished, click **Save Settings** (or **Create Town & Upload Data** if this is your first time).

---

## Step 2 — Upload Your Budget Data

Go to the **Upload** tab. You will do this once per fiscal year, or whenever the budget is updated.

OpenBook accepts Excel files (`.xlsx`) and CSV files (`.csv`) up to 10 MB. These are the same formats your accounting software exports. You will upload a separate file for each data type.

### The upload has three steps:

---

### Step 2a — Choose a Category

Use the dropdown to select what type of data you are uploading:

- **Expenses** — how the town spends money
- **Revenues** — where the town's money comes from
- **Capital Projects** — large, one-time expenditures
- **Reserves** — stabilization funds and free cash (stored but not yet shown on the public portal)

After you pick a category, a sample table appears showing what your file should look like. Your column names do not need to match the sample exactly — OpenBook will help you match them in the next step.

---

### Step 2b — Upload Your File

Drag your file into the upload box, or click inside the box to browse for the file on your computer. OpenBook will read the file and show you:
- How many rows were detected
- How many columns were found
- A preview of the first two rows

If you see an error at this stage, the most common causes are:
- The file has a title row above the column headers (delete it in Excel first)
- The file is not saved as `.csv` or `.xlsx`
- The file is larger than 10 MB

---

### Step 2c — Map Your Columns

OpenBook looks at your column headers and tries to automatically match them to the fields it needs. Columns it recognized automatically are labeled **Auto** in green.

Review each column and use the dropdown next to it to confirm or correct the match. If a column is not relevant, choose **Skip this column**.

**For any column that contains dollar amounts**, you must also:
1. Set the **Fiscal Year** — type the year (e.g., `2026`)
2. Set the **Type** — choose either `Budget` (a planned amount) or `Actual` (money already spent)

A yellow warning box will tell you if anything required is missing before you can save.

**Required fields by category:**

| Category | Required |
|---|---|
| Expenses | Function Area; at least one dollar amount column set to "Budget" |
| Revenues | Category; at least one dollar amount column set to "Budget" |
| Capital Projects | Department; Purpose/Project; Funding Source; at least one dollar amount column |
| Reserves | None required (data is stored but not displayed publicly yet) |

When everything looks correct and no warnings remain, click **Confirm & Save Data**. You will be taken to the **Data** tab when the upload is complete.

> **Tip:** You can upload multiple files. For example, upload your expenses file first, then come back and upload your revenues file. Each category lives independently on the portal.

---

## Step 3 — Check Your Uploaded Data

Go to the **Data** tab.

This page lists every file you have uploaded, with the file name, category, number of rows, status, and date. Status will show **mapped** (green) when data was saved successfully.

From this page you can:
- **Replace** a file — deletes the old data and opens the upload page so you can upload a corrected version
- **Delete** a specific file — permanently removes that upload and its data from the portal
- **Delete All Data** — removes everything and starts fresh (requires a confirmation click)

> **Important:** Deleting an upload immediately removes that data from the public portal. If your portal is live, residents will no longer see that information until you upload a replacement.

---

## Step 4 — Preview Your Portal

Click **Preview** in the top navigation bar. This opens your public portal in a new browser tab so you can see exactly what residents will see.

Check that:
- The charts and summary numbers look correct
- The town name, color, and logo appear as expected
- Data is showing for each category you uploaded

Come back to the admin panel to make any corrections.

---

## Step 5 — Add Tooltips (Optional but Recommended)

Go to the **Tooltips** tab.

Tooltips are short explanations that appear when a resident hovers over or taps on a budget category or line item on the public portal. A small `?` icon marks anything that has a tooltip. This is one of the most valuable things you can do to make the budget understandable for residents.

### Category Explainers

These are explanations for broad budget groupings, like "Public Safety" or "General Government."

1. Use the dropdown to choose a category from your uploaded data
2. Type a one- or two-sentence explanation in plain language
3. Click **Save**

Categories that already have an explanation show a `●` dot in the dropdown.

**Example:** For the category "Unclassified," you might write: *"Includes town-wide costs like employee health insurance, retirement contributions, and liability insurance that don't belong to a single department."*

### Line Item Hover Text

These are explanations for individual rows in the budget tables, like "Cherry Sheet Assessments" or "Debt Service."

1. Use the dropdown to choose a line item
2. Type a short explanation
3. Click **Save**

To remove a tooltip, clear the text field and click Save.

---

## Step 6 — Add Supporting Links (Optional)

Go to the **Links** tab.

Supporting links appear on the public portal's Documents & Resources page. Use these to point residents to external websites — for example, the town meeting warrant posted on your town's main website, a state aid summary, or a press release.

To add a link:
1. Enter a **Title** — the clickable text residents will see (e.g., `FY2026 Adopted Budget`)
2. Enter the **URL** — the full web address, starting with `https://`
3. Optionally add a **Description** — a sentence explaining what the link contains
4. Choose a **Category** — Budget Document, Meeting Minutes, Report, Press Release, or Other

Click **Add Link**. The link appears on your portal immediately.

To edit or delete a link, use the **Edit** and **Delete** buttons next to each existing link.

---

## Step 7 — Upload PDF Documents (Optional)

Go to the **PDFs** tab.

You can upload PDF files that residents can download directly from your portal — for example, the full adopted budget document, annual reports, or fee schedules. Maximum file size is 50 MB per file.

To upload a PDF:
1. Drag the file into the upload box, or click **browse to select**
2. Optionally give it a **Display Title** (what residents will see — defaults to the file name)
3. Choose a **Category** (Budget Document, Meeting Minutes, Report, Press Release, or Other)
4. Click **Upload PDF**

To delete a PDF, click **Delete** next to it. This permanently removes the file.

---

## Responding to Resident Questions

Go to the **Questions** tab.

This tab shows questions that were previously submitted through the portal. New questions from residents are now directed to your contact email directly (the email you set in Settings), so you will receive them in your inbox like any other email.

The Questions tab is useful for reviewing older submissions. You can filter by status (New, Read, Replied), mark questions as read, and delete spam or off-topic messages.

---

## Reviewing Capital Requests from Staff

Go to the **Requests** tab.

If your town uses the staff portal feature, department staff can submit capital expenditure requests through a separate login. This tab shows all those requests in a table with:
- Department name
- Purpose of the request
- Dollar amount
- Staff member's name
- Submission date
- Current status

Click any row to expand it and see the full details, including description, justification, and proposed funding source.

### To take action on a request:

1. Click the row to expand it
2. Optionally type **Admin Notes** — these are visible to the staff member
3. Click one of the three action buttons:
   - **Approve** — marks the request as approved
   - **Deny** — marks the request as denied
   - **Under Review** — marks it as in progress

Status changes are visible to staff immediately when they log into the staff portal.

---

## Transferring Admin Access to a New Person

Go to the **Transfer** tab.

If you are leaving your role and a new person is taking over, use this tab to create a new admin account and hand access over cleanly.

1. Enter the new admin's **name**
2. Enter their **email address**
3. Create a **password** for them (at least 8 characters)
4. Confirm the password
5. Click **Transfer Account**
6. Click **Confirm Transfer** when the warning appears

Your account will be deleted and the new account will be created. The new admin should go to the login page and sign in with their email and the password you created.

> **Important:** This action cannot be undone. Make sure you have shared the new login credentials with the incoming admin before confirming.

---

## Updating the Budget Each Year

At the start of each fiscal year, here is the recommended process:

1. Export your new budget data from your financial system as CSV or Excel files
2. Go to **Data** and delete the previous year's uploads (or keep them for year-over-year comparison — OpenBook can display multiple years)
3. Go to **Upload** and upload the new files
4. Go to **Preview** to confirm everything looks right
5. Review your **Tooltips** — some may need updating if categories changed

That's it. The portal updates immediately when new data is saved.

---

## Tips

- **Keep tooltips short.** One or two sentences is ideal. Long explanations tend not to be read.
- **Use your brand color.** A color that matches your town's official palette makes the portal look more official and trustworthy.
- **Upload multiple years.** If you have actual spending data from previous years alongside this year's budget, upload them all. OpenBook will show year-over-year trend charts automatically.
- **Test on a phone.** The portal works on mobile devices. Check Preview on your phone to make sure everything looks good for residents browsing on the go.
