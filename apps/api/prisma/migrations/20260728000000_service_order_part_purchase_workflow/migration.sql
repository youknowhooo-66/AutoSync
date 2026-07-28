-- Migration: 20260728000000_service_order_part_purchase_workflow

-- 1. AlterEnum PurchaseRequestStatus with explicit CASE mapping for legacy values
BEGIN;
CREATE TYPE "PurchaseRequestStatus_new" AS ENUM ('REQUESTED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'INSTALLED', 'CANCELED');
ALTER TABLE "public"."PurchaseRequest" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "PurchaseRequest" ALTER COLUMN "status" TYPE "PurchaseRequestStatus_new"
  USING (
    CASE "status"::text
      WHEN 'DRAFT' THEN 'REQUESTED'::"PurchaseRequestStatus_new"
      WHEN 'PENDING_APPROVAL' THEN 'IN_PROGRESS'::"PurchaseRequestStatus_new"
      WHEN 'APPROVED' THEN 'IN_PROGRESS'::"PurchaseRequestStatus_new"
      WHEN 'ORDERED' THEN 'IN_PROGRESS'::"PurchaseRequestStatus_new"
      WHEN 'PARTIALLY_RECEIVED' THEN 'IN_PROGRESS'::"PurchaseRequestStatus_new"
      WHEN 'RECEIVED' THEN 'READY_FOR_PICKUP'::"PurchaseRequestStatus_new"
      WHEN 'CANCELLED' THEN 'CANCELED'::"PurchaseRequestStatus_new"
      ELSE 'REQUESTED'::"PurchaseRequestStatus_new"
    END
  );

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PurchaseRequestEvent') THEN
    ALTER TABLE "PurchaseRequestEvent" ALTER COLUMN "fromStatus" TYPE "PurchaseRequestStatus_new"
      USING (
        CASE "fromStatus"::text
          WHEN 'DRAFT' THEN 'REQUESTED'::"PurchaseRequestStatus_new"
          WHEN 'PENDING_APPROVAL' THEN 'IN_PROGRESS'::"PurchaseRequestStatus_new"
          WHEN 'APPROVED' THEN 'IN_PROGRESS'::"PurchaseRequestStatus_new"
          WHEN 'ORDERED' THEN 'IN_PROGRESS'::"PurchaseRequestStatus_new"
          WHEN 'PARTIALLY_RECEIVED' THEN 'IN_PROGRESS'::"PurchaseRequestStatus_new"
          WHEN 'RECEIVED' THEN 'READY_FOR_PICKUP'::"PurchaseRequestStatus_new"
          WHEN 'CANCELLED' THEN 'CANCELED'::"PurchaseRequestStatus_new"
          ELSE NULL
        END
      );
    ALTER TABLE "PurchaseRequestEvent" ALTER COLUMN "toStatus" TYPE "PurchaseRequestStatus_new"
      USING (
        CASE "toStatus"::text
          WHEN 'DRAFT' THEN 'REQUESTED'::"PurchaseRequestStatus_new"
          WHEN 'PENDING_APPROVAL' THEN 'IN_PROGRESS'::"PurchaseRequestStatus_new"
          WHEN 'APPROVED' THEN 'IN_PROGRESS'::"PurchaseRequestStatus_new"
          WHEN 'ORDERED' THEN 'IN_PROGRESS'::"PurchaseRequestStatus_new"
          WHEN 'PARTIALLY_RECEIVED' THEN 'IN_PROGRESS'::"PurchaseRequestStatus_new"
          WHEN 'RECEIVED' THEN 'READY_FOR_PICKUP'::"PurchaseRequestStatus_new"
          WHEN 'CANCELLED' THEN 'CANCELED'::"PurchaseRequestStatus_new"
          ELSE NULL
        END
      );
  END IF;
END $$;

ALTER TYPE "PurchaseRequestStatus" RENAME TO "PurchaseRequestStatus_old";
ALTER TYPE "PurchaseRequestStatus_new" RENAME TO "PurchaseRequestStatus";
DROP TYPE "public"."PurchaseRequestStatus_old";
ALTER TABLE "PurchaseRequest" ALTER COLUMN "status" SET DEFAULT 'REQUESTED';
COMMIT;

-- 2. AlterTable OSPart: make unitPrice optional
ALTER TABLE "OSPart" ALTER COLUMN "unitPrice" DROP NOT NULL;

-- 3. AlterTable PurchaseRequest: add new fields if not exist
ALTER TABLE "PurchaseRequest"
  ADD COLUMN IF NOT EXISTS "provisionalName" TEXT,
  ADD COLUMN IF NOT EXISTS "requestedQuantity" DECIMAL(12,3),
  ADD COLUMN IF NOT EXISTS "purchasedQuantity" DECIMAL(12,3),
  ADD COLUMN IF NOT EXISTS "unitPrice" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS "mechanicNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "financialNote" TEXT,
  ADD COLUMN IF NOT EXISTS "purchaseOrderRef" TEXT,
  ADD COLUMN IF NOT EXISTS "stockId" TEXT,
  ADD COLUMN IF NOT EXISTS "viewedById" TEXT,
  ADD COLUMN IF NOT EXISTS "purchasedById" TEXT,
  ADD COLUMN IF NOT EXISTS "receivedById" TEXT,
  ADD COLUMN IF NOT EXISTS "installedById" TEXT,
  ADD COLUMN IF NOT EXISTS "viewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "purchasedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "readyForPickupAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "installedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "canceledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "canceledById" TEXT,
  ADD COLUMN IF NOT EXISTS "cancelReason" TEXT,
  ADD COLUMN IF NOT EXISTS "expectedDeliveryAt" TIMESTAMP(3);

ALTER TABLE "PurchaseRequest"
  ALTER COLUMN "osPartId" DROP NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'REQUESTED';

-- 4. AlterTable StockReservation: add purchaseRequestId, approvalId optional
DROP INDEX IF EXISTS "StockReservation_osPartId_approvalId_stockId_key";
DROP INDEX IF EXISTS "StockReservation_osPartId_stockId_key";
DROP INDEX IF EXISTS "StockReservation_active_osPart_stock_key";

ALTER TABLE "StockReservation"
  ADD COLUMN IF NOT EXISTS "purchaseRequestId" TEXT,
  ALTER COLUMN "approvalId" DROP NOT NULL;

-- B-tree index for osPartId + stockId lookups
CREATE INDEX IF NOT EXISTS "StockReservation_osPartId_stockId_idx" ON "StockReservation"("osPartId", "stockId");

-- Partial unique index for active reservations only (allows historical inactive reservations to be preserved)
CREATE UNIQUE INDEX "StockReservation_active_osPart_stock_key"
  ON "StockReservation" ("osPartId", "stockId")
  WHERE "status" IN ('ACTIVE', 'PARTIALLY_CONSUMED');

-- Check constraint: must have osPartId and at least one valid origin (approvalId OR purchaseRequestId)
ALTER TABLE "StockReservation"
  DROP CONSTRAINT IF EXISTS "chk_reservation_origin";

ALTER TABLE "StockReservation"
  ADD CONSTRAINT "chk_reservation_origin"
  CHECK (
    "osPartId" IS NOT NULL
    AND (
      "approvalId" IS NOT NULL
      OR "purchaseRequestId" IS NOT NULL
    )
  );

-- 5. CreateTable PurchaseRequestEvent
CREATE TABLE IF NOT EXISTS "PurchaseRequestEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStatus" "PurchaseRequestStatus",
    "toStatus" "PurchaseRequestStatus",
    "actorId" TEXT NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseRequestEvent_pkey" PRIMARY KEY ("id")
);

-- 6. CreateTable Notification
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "PurchaseRequestEvent_companyId_purchaseRequestId_occurredAt_idx" ON "PurchaseRequestEvent"("companyId", "purchaseRequestId", "occurredAt");

CREATE INDEX IF NOT EXISTS "Notification_companyId_recipientId_readAt_createdAt_idx" ON "Notification"("companyId", "recipientId", "readAt", "createdAt");

CREATE INDEX IF NOT EXISTS "Notification_companyId_entityType_entityId_idx" ON "Notification"("companyId", "entityType", "entityId");

CREATE INDEX IF NOT EXISTS "StockReservation_purchaseRequestId_status_idx" ON "StockReservation"("purchaseRequestId", "status");

-- Foreign Keys
ALTER TABLE "StockReservation" DROP CONSTRAINT IF EXISTS "StockReservation_purchaseRequestId_fkey";
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseRequest" DROP CONSTRAINT IF EXISTS "PurchaseRequest_stockId_fkey";
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseRequest" DROP CONSTRAINT IF EXISTS "PurchaseRequest_createdBy_fkey";
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseRequest" DROP CONSTRAINT IF EXISTS "PurchaseRequest_viewedById_fkey";
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_viewedById_fkey" FOREIGN KEY ("viewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseRequest" DROP CONSTRAINT IF EXISTS "PurchaseRequest_purchasedById_fkey";
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_purchasedById_fkey" FOREIGN KEY ("purchasedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseRequest" DROP CONSTRAINT IF EXISTS "PurchaseRequest_receivedById_fkey";
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseRequest" DROP CONSTRAINT IF EXISTS "PurchaseRequest_installedById_fkey";
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_installedById_fkey" FOREIGN KEY ("installedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseRequestEvent" DROP CONSTRAINT IF EXISTS "PurchaseRequestEvent_companyId_fkey";
ALTER TABLE "PurchaseRequestEvent" ADD CONSTRAINT "PurchaseRequestEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseRequestEvent" DROP CONSTRAINT IF EXISTS "PurchaseRequestEvent_purchaseRequestId_fkey";
ALTER TABLE "PurchaseRequestEvent" ADD CONSTRAINT "PurchaseRequestEvent_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseRequestEvent" DROP CONSTRAINT IF EXISTS "PurchaseRequestEvent_actorId_fkey";
ALTER TABLE "PurchaseRequestEvent" ADD CONSTRAINT "PurchaseRequestEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_companyId_fkey";
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_recipientId_fkey";
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
