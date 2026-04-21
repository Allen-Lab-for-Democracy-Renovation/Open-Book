-- CreateTable
CREATE TABLE "Town" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#1e40af',
    "inviteCode" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "townId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "dataCategory" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "rawHeaders" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Upload_townId_fkey" FOREIGN KEY ("townId") REFERENCES "Town" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ColumnMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "townId" TEXT NOT NULL,
    "dataCategory" TEXT NOT NULL,
    "sourceColumn" TEXT NOT NULL,
    "targetField" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ColumnMapping_townId_fkey" FOREIGN KEY ("townId") REFERENCES "Town" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BudgetRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "townId" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "dataCategory" TEXT NOT NULL,
    "fundCode" TEXT,
    "fundName" TEXT,
    "department" TEXT,
    "departmentCode" TEXT,
    "functionArea" TEXT,
    "lineItem" TEXT,
    "objectCode" TEXT,
    "category1" TEXT,
    "category2" TEXT,
    "fiscalYear" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "amountType" TEXT NOT NULL,
    "purpose" TEXT,
    "fundingSource" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetRow_townId_fkey" FOREIGN KEY ("townId") REFERENCES "Town" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Town_slug_key" ON "Town"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ColumnMapping_townId_dataCategory_sourceColumn_key" ON "ColumnMapping"("townId", "dataCategory", "sourceColumn");

-- CreateIndex
CREATE INDEX "BudgetRow_townId_dataCategory_idx" ON "BudgetRow"("townId", "dataCategory");

-- CreateIndex
CREATE INDEX "BudgetRow_townId_dataCategory_fiscalYear_idx" ON "BudgetRow"("townId", "dataCategory", "fiscalYear");

-- CreateIndex
CREATE INDEX "BudgetRow_townId_fundCode_idx" ON "BudgetRow"("townId", "fundCode");
