/*
  Warnings:

  - A unique constraint covering the columns `[serviceOrderId,serviceOrderApprovalId]` on the table `FinancialRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FinancialRecord" ADD COLUMN     "serviceOrderApprovalId" TEXT,
ADD COLUMN     "serviceOrderId" TEXT;

-- CreateIndex
CREATE INDEX "FinancialRecord_serviceOrderApprovalId_idx" ON "FinancialRecord"("serviceOrderApprovalId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialRecord_serviceOrderId_serviceOrderApprovalId_key" ON "FinancialRecord"("serviceOrderId", "serviceOrderApprovalId");

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_serviceOrderApprovalId_fkey" FOREIGN KEY ("serviceOrderApprovalId") REFERENCES "ServiceOrderApproval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
