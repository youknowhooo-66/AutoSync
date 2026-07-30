-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN     "completionNotes" TEXT,
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "finishedById" TEXT;

-- CreateIndex
CREATE INDEX "ServiceOrder_finishedById_idx" ON "ServiceOrder"("finishedById");

-- CreateIndex
CREATE INDEX "ServiceOrder_status_finishedAt_idx" ON "ServiceOrder"("status", "finishedAt");

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_finishedById_fkey" FOREIGN KEY ("finishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
