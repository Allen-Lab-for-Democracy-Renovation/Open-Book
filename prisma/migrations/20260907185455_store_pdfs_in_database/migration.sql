-- AlterTable
ALTER TABLE "PdfDocument" ADD COLUMN     "description" TEXT,
ADD COLUMN     "fileData" BYTEA,
ALTER COLUMN "filePath" DROP NOT NULL;
