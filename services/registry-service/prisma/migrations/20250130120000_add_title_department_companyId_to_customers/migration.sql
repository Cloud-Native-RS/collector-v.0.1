-- AlterTable
ALTER TABLE "customers" ADD COLUMN "title" TEXT;
ALTER TABLE "customers" ADD COLUMN "department" TEXT;
ALTER TABLE "customers" ADD COLUMN "companyId" TEXT;

-- CreateIndex
CREATE INDEX "customers_companyId_idx" ON "customers"("companyId");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

