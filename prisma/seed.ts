import { prisma } from "../src/lib/db.js";
import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";

function parseCSV(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });
  return result.data;
}

function parseAmount(value: string): number {
  if (!value) return 0;
  const cleaned = value.toString().replace(/[$,\s()]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.budgetRow.deleteMany();
  await prisma.columnMapping.deleteMany();
  await prisma.upload.deleteMany();
  await prisma.town.deleteMany();

  // Create Sutton
  const sutton = await prisma.town.create({
    data: {
      name: "Sutton",
      slug: "sutton",
      primaryColor: "#3f6522",
      inviteCode: "sutton-pilot",
      published: true,
    },
  });

  console.log("Created town:", sutton.name);

  const sampleDir = path.join(__dirname, "..", "sample-data");

  // Build chart of accounts lookup
  const coaRows = parseCSV(path.join(sampleDir, "chart-of-accounts.csv"));
  const deptMap = new Map<string, { department: string; function1: string; function2: string }>();
  for (const row of coaRows) {
    const code = row["DEPT CODE"]?.trim();
    if (code) {
      deptMap.set(code, {
        department: row["DEPARTMENT"]?.trim() || "",
        function1: row["FUNCTION_1"]?.trim() || "",
        function2: row["FUNCTION_2"]?.trim() || "",
      });
    }
  }

  // Seed expenses
  const expenseRows = parseCSV(path.join(sampleDir, "expenses.csv"));
  const expenseUpload = await prisma.upload.create({
    data: {
      townId: sutton.id,
      fileName: "expenses.csv",
      fileType: "csv",
      dataCategory: "expenses",
      rowCount: expenseRows.length,
      status: "published",
      rawHeaders: JSON.stringify(["Account Number", "Description", "2023 ACTUAL", "2024 ACTUAL", "2025 BUDGET", "2026 BUDGET"]),
    },
  });

  const expenseBudgetRows = [];
  const fyColumns = [
    { col: "2023 ACTUAL", fy: "2023", type: "actual" },
    { col: "2024 ACTUAL", fy: "2024", type: "actual" },
    { col: "2025 BUDGET", fy: "2025", type: "budget" },
    { col: "2026 BUDGET", fy: "2026", type: "budget" },
  ];

  for (const row of expenseRows) {
    const acct = row["Account Number"]?.trim() || "";
    const parts = acct.split("-");
    const fundCode = parts[0] || null;
    const deptCode = parts[1] || null;
    const coaEntry = deptCode ? deptMap.get(deptCode) : null;

    for (const fy of fyColumns) {
      const amount = parseAmount(row[fy.col]);
      if (amount === 0 && !row[fy.col]) continue;
      expenseBudgetRows.push({
        townId: sutton.id,
        uploadId: expenseUpload.id,
        dataCategory: "expenses",
        fundCode,
        fundName: fundCode === "010" ? "General Fund" : fundCode === "600" ? "Sewer Enterprise" : fundCode === "650" ? "Transfer Station" : null,
        department: coaEntry?.department || null,
        departmentCode: deptCode,
        functionArea: coaEntry?.function2 || coaEntry?.function1 || null,
        lineItem: row["Description"]?.trim() || null,
        objectCode: acct,
        fiscalYear: fy.fy,
        amount,
        amountType: fy.type,
      });
    }
  }

  await prisma.budgetRow.createMany({ data: expenseBudgetRows });
  console.log(`Seeded ${expenseBudgetRows.length} expense rows`);

  // Seed revenues
  const revenueRows = parseCSV(path.join(sampleDir, "revenues.csv"));
  const revenueUpload = await prisma.upload.create({
    data: {
      townId: sutton.id,
      fileName: "revenues.csv",
      fileType: "csv",
      dataCategory: "revenues",
      rowCount: revenueRows.length,
      status: "published",
      rawHeaders: JSON.stringify(["REV_CATEGORY_1", "REV_CATEGORY_2", "Description", "2023 ACTUAL", "2024 ACTUAL", "2025 ACTUAL", "2026 BUDGET"]),
    },
  });

  const revBudgetRows = [];
  const revFyColumns = [
    { col: "2023 ACTUAL", fy: "2023", type: "actual" },
    { col: "2024 ACTUAL", fy: "2024", type: "actual" },
    { col: "2025 ACTUAL", fy: "2025", type: "actual" },
    { col: "2026 BUDGET", fy: "2026", type: "budget" },
  ];

  for (const row of revenueRows) {
    for (const fy of revFyColumns) {
      const amount = parseAmount(row[fy.col]);
      if (amount === 0 && !row[fy.col]) continue;
      revBudgetRows.push({
        townId: sutton.id,
        uploadId: revenueUpload.id,
        dataCategory: "revenues",
        category1: row["REV_CATEGORY_1"]?.trim() || null,
        category2: row["REV_CATEGORY_2"]?.trim() || null,
        lineItem: row["Description"]?.trim() || null,
        fiscalYear: fy.fy,
        amount,
        amountType: fy.type,
      });
    }
  }

  await prisma.budgetRow.createMany({ data: revBudgetRows });
  console.log(`Seeded ${revBudgetRows.length} revenue rows`);

  // Seed capital
  const capitalRows = parseCSV(path.join(sampleDir, "capital.csv"));
  const capitalUpload = await prisma.upload.create({
    data: {
      townId: sutton.id,
      fileName: "capital.csv",
      fileType: "csv",
      dataCategory: "capital",
      rowCount: capitalRows.length,
      status: "published",
      rawHeaders: JSON.stringify(["FISCAL YEAR", "DEPARTMENT", "PURPOSE", "AMOUNT", "FUNDING SOURCE"]),
    },
  });

  const capBudgetRows = [];
  for (const row of capitalRows) {
    const amount = parseAmount(row["AMOUNT"]);
    capBudgetRows.push({
      townId: sutton.id,
      uploadId: capitalUpload.id,
      dataCategory: "capital",
      department: row["DEPARTMENT"]?.trim() || null,
      purpose: row["PURPOSE"]?.trim() || null,
      fundingSource: row["FUNDING SOURCE"]?.trim() || null,
      fiscalYear: row["FISCAL YEAR"]?.trim() || "unknown",
      amount,
      amountType: "budget",
    });
  }

  await prisma.budgetRow.createMany({ data: capBudgetRows });
  console.log(`Seeded ${capBudgetRows.length} capital rows`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
