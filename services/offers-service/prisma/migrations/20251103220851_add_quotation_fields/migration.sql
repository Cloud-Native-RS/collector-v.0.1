-- AlterTable
ALTER TABLE "offers"."offers" 
ADD COLUMN "customerName" TEXT,
ADD COLUMN "customerDetails" JSONB,
ADD COLUMN "fromDetails" JSONB,
ADD COLUMN "paymentDetails" JSONB,
ADD COLUMN "noteDetails" JSONB,
ADD COLUMN "topBlock" JSONB,
ADD COLUMN "bottomBlock" JSONB,
ADD COLUMN "template" JSONB,
ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "dateFormat" TEXT NOT NULL DEFAULT 'dd.MM.yyyy',
ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en-US',
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN "includeDecimals" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "includeUnits" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "token" TEXT,
ADD COLUMN "viewedAt" TIMESTAMP(3),
ADD COLUMN "sentTo" TEXT,
ADD COLUMN "convertedToInvoiceId" TEXT;

-- AlterTable
ALTER TABLE "offers"."offer_line_items" 
ADD COLUMN "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN "unit" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "offers_token_key" ON "offers"."offers"("token");

-- CreateIndex
CREATE INDEX "offers_token_idx" ON "offers"."offers"("token");

-- Update existing records to set name from description
UPDATE "offers"."offer_line_items" SET "name" = "description";

