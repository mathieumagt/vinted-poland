-- CreateEnum
CREATE TYPE "StockItemStatus" AS ENUM ('IN_STOCK', 'REMOVED');

-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "note" TEXT,
    "photoUrl" TEXT NOT NULL,
    "status" "StockItemStatus" NOT NULL DEFAULT 'IN_STOCK',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedById" TEXT,
    "removedAt" TIMESTAMP(3),
    "removedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockItem_status_idx" ON "StockItem"("status");

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_removedById_fkey" FOREIGN KEY ("removedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
