-- DropForeignKey
ALTER TABLE "CapitalRequest" DROP CONSTRAINT "CapitalRequest_staffUserId_fkey";

-- AlterTable
ALTER TABLE "CapitalRequest" ALTER COLUMN "staffUserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CapitalRequest" ADD CONSTRAINT "CapitalRequest_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
