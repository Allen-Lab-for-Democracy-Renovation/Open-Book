-- AlterTable: add allowedDomains to Town
ALTER TABLE "Town" ADD COLUMN "allowedDomains" TEXT NOT NULL DEFAULT '';

-- AlterTable: add resetToken to StaffUser
ALTER TABLE "StaffUser" ADD COLUMN "resetToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_resetToken_key" ON "StaffUser"("resetToken");

-- CreateTable
CREATE TABLE "StaffInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "townId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffInvite_townId_fkey" FOREIGN KEY ("townId") REFERENCES "Town" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvite_token_key" ON "StaffInvite"("token");

-- CreateIndex
CREATE INDEX "StaffInvite_townId_idx" ON "StaffInvite"("townId");
