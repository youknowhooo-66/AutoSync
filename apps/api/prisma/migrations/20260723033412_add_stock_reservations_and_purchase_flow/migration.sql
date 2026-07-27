/*
  Warnings:

  - You are about to alter the column `quantity` on the `InventoryMovement` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(12,3)`.
  - You are about to alter the column `quantity` on the `OSPart` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(12,3)`.
  - You are about to alter the column `consumedQuantity` on the `OSPart` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(12,3)`.
  - You are about to alter the column `quantity` on the `Stock` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(12,3)`.

*/
-- CreateEnum
CREATE TYPE "PartSupplySource" AS ENUM ('STOCK', 'PURCHASE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "StockReservationStatus" AS ENUM ('ACTIVE', 'PARTIALLY_CONSUMED', 'CONSUMED', 'RELEASED', 'PARTIALLY_CONSUMED_RELEASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "OSPart" DROP CONSTRAINT "OSPart_partId_fkey";

-- AlterTable
ALTER TABLE "InventoryMovement" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "OSPart" ADD COLUMN     "description" TEXT,
ADD COLUMN     "supplySource" "PartSupplySource" NOT NULL DEFAULT 'STOCK',
ALTER COLUMN "partId" DROP NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "consumedQuantity" SET DEFAULT 0,
ALTER COLUMN "consumedQuantity" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "averageCost" DECIMAL(10,2),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "reservedQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
ALTER COLUMN "quantity" SET DEFAULT 0,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3);

-- CreateTable
CREATE TABLE "StockReservation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "osPartId" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "consumedQty" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "releasedQty" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "cancelledQty" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "status" "StockReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "osPartId" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "supplierId" TEXT,
    "partId" TEXT,
    "description" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL,
    "estimatedUnitCost" DECIMAL(10,2),
    "estimatedDate" TIMESTAMP(3),
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "orderedAt" TIMESTAMP(3),
    "fullyReceivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReceipt" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "invoiceAccessKey" TEXT,
    "notes" TEXT,
    "receivedById" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockReservation_companyId_branchId_idx" ON "StockReservation"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "StockReservation_serviceOrderId_status_idx" ON "StockReservation"("serviceOrderId", "status");

-- CreateIndex
CREATE INDEX "StockReservation_stockId_status_idx" ON "StockReservation"("stockId", "status");

-- CreateIndex
CREATE INDEX "StockReservation_approvalId_status_idx" ON "StockReservation"("approvalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StockReservation_osPartId_approvalId_stockId_key" ON "StockReservation"("osPartId", "approvalId", "stockId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_osPartId_key" ON "PurchaseRequest"("osPartId");

-- CreateIndex
CREATE INDEX "PurchaseReceipt_purchaseRequestId_receivedAt_idx" ON "PurchaseReceipt"("purchaseRequestId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReceipt_purchaseRequestId_idempotencyKey_key" ON "PurchaseReceipt"("purchaseRequestId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "OSPart" ADD CONSTRAINT "OSPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_osPartId_fkey" FOREIGN KEY ("osPartId") REFERENCES "OSPart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "ServiceOrderApproval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_osPartId_fkey" FOREIGN KEY ("osPartId") REFERENCES "OSPart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
