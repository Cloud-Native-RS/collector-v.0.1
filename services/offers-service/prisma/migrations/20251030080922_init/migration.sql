-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'RSD', 'OTHER');

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "offerNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "subtotal" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "approvalToken" TEXT,
    "notes" TEXT,
    "parentOfferId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_line_items" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(19,4) NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(19,4) NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "approverEmail" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offers_offerNumber_key" ON "offers"("offerNumber");

-- CreateIndex
CREATE UNIQUE INDEX "offers_approvalToken_key" ON "offers"("approvalToken");

-- CreateIndex
CREATE INDEX "offers_tenantId_idx" ON "offers"("tenantId");

-- CreateIndex
CREATE INDEX "offers_customerId_idx" ON "offers"("customerId");

-- CreateIndex
CREATE INDEX "offers_status_idx" ON "offers"("status");

-- CreateIndex
CREATE INDEX "offers_offerNumber_idx" ON "offers"("offerNumber");

-- CreateIndex
CREATE INDEX "offers_validUntil_idx" ON "offers"("validUntil");

-- CreateIndex
CREATE INDEX "offers_approvalToken_idx" ON "offers"("approvalToken");

-- CreateIndex
CREATE INDEX "offers_parentOfferId_idx" ON "offers"("parentOfferId");

-- CreateIndex
CREATE INDEX "offer_line_items_tenantId_idx" ON "offer_line_items"("tenantId");

-- CreateIndex
CREATE INDEX "offer_line_items_offerId_idx" ON "offer_line_items"("offerId");

-- CreateIndex
CREATE INDEX "offer_line_items_productId_idx" ON "offer_line_items"("productId");

-- CreateIndex
CREATE INDEX "approvals_tenantId_idx" ON "approvals"("tenantId");

-- CreateIndex
CREATE INDEX "approvals_offerId_idx" ON "approvals"("offerId");

-- CreateIndex
CREATE INDEX "approvals_approverEmail_idx" ON "approvals"("approverEmail");

-- CreateIndex
CREATE INDEX "approvals_status_idx" ON "approvals"("status");

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_parentOfferId_fkey" FOREIGN KEY ("parentOfferId") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_line_items" ADD CONSTRAINT "offer_line_items_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
