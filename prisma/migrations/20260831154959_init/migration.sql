-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('DOTB', 'MANUAL');

-- CreateEnum
CREATE TYPE "LocalStatus" AS ENUM ('PENDING_REVIEW', 'RELEASED', 'PACKED', 'SHIPPED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VintedAccountSelection" (
    "id" TEXT NOT NULL,
    "dotbAccountId" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "vintedId" TEXT,
    "country" TEXT,
    "bridgeConnected" BOOLEAN NOT NULL DEFAULT false,
    "bridgeLastSeenAt" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VintedAccountSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "source" "OrderSource" NOT NULL DEFAULT 'MANUAL',
    "dotbOrderId" TEXT,
    "accountId" TEXT,
    "title" TEXT NOT NULL,
    "dotbStatus" TEXT,
    "orderDate" TIMESTAMP(3),
    "shippingAddress" JSONB,
    "shippingLabelUrl" TEXT,
    "shippingDeadlineDate" TIMESTAMP(3),
    "carrierName" TEXT,
    "trackingCode" TEXT,
    "trackingUrl" TEXT,
    "itemCount" INTEGER,
    "vintedTransactionId" TEXT,
    "vintedConversationId" TEXT,
    "subtotal" DECIMAL(10,2),
    "shipping" DECIMAL(10,2),
    "currency" TEXT,
    "payout" DECIMAL(10,2),
    "totalCost" DECIMAL(10,2),
    "buyerVintedId" TEXT,
    "buyerLogin" TEXT,
    "buyerName" TEXT,
    "buyerEmail" TEXT,
    "buyerCountryCode" TEXT,
    "note" TEXT,
    "localStatus" "LocalStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "releasedAt" TIMESTAMP(3),
    "releasedById" TEXT,
    "packedAt" TIMESTAMP(3),
    "packedById" TEXT,
    "shippedAt" TIMESTAMP(3),
    "shippedById" TEXT,
    "createdById" TEXT,
    "dotbPackSyncStatus" TEXT,
    "dotbPackSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "dotbItemId" TEXT,
    "title" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "sellingPrice" DECIMAL(10,2),
    "purchasePrice" DECIMAL(10,2),
    "sku" TEXT,
    "location" TEXT,
    "catalogId" TEXT,
    "vintedId" TEXT,
    "vintedItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VintedAccountSelection_dotbAccountId_key" ON "VintedAccountSelection"("dotbAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_dotbOrderId_key" ON "Order"("dotbOrderId");

-- CreateIndex
CREATE INDEX "Order_localStatus_idx" ON "Order"("localStatus");

-- CreateIndex
CREATE INDEX "Order_accountId_idx" ON "Order"("accountId");

-- CreateIndex
CREATE INDEX "Order_shippedAt_idx" ON "Order"("shippedAt");

-- CreateIndex
CREATE INDEX "Order_orderDate_idx" ON "Order"("orderDate");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_dotbItemId_key" ON "OrderItem"("orderId", "dotbItemId");

-- CreateIndex
CREATE INDEX "ActivityLog_orderId_idx" ON "ActivityLog"("orderId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "VintedAccountSelection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_releasedById_fkey" FOREIGN KEY ("releasedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_packedById_fkey" FOREIGN KEY ("packedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippedById_fkey" FOREIGN KEY ("shippedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
