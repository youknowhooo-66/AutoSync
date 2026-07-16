/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `InventoryMovement` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "OSPart" DROP CONSTRAINT "OSPart_serviceOrderId_fkey";

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "osPartId" TEXT,
ADD COLUMN     "serviceOrderId" TEXT;

-- AlterTable
ALTER TABLE "OSPart" ADD COLUMN     "consumedQuantity" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_idempotencyKey_key" ON "InventoryMovement"("idempotencyKey");

-- CreateIndex
CREATE INDEX "InventoryMovement_serviceOrderId_idx" ON "InventoryMovement"("serviceOrderId");

-- CreateIndex
CREATE INDEX "InventoryMovement_osPartId_idx" ON "InventoryMovement"("osPartId");

-- CreateIndex
CREATE INDEX "InventoryMovement_branchId_createdAt_idx" ON "InventoryMovement"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "OSPart_serviceOrderId_idx" ON "OSPart"("serviceOrderId");

-- CreateIndex
CREATE INDEX "OSPart_partId_idx" ON "OSPart"("partId");

-- AddForeignKey
ALTER TABLE "OSPart" ADD CONSTRAINT "OSPart_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_osPartId_fkey" FOREIGN KEY ("osPartId") REFERENCES "OSPart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
