/*
  Warnings:

  - The values [PRIVATE,PUBLIC] on the enum `ClientType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `document` on the `Supplier` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `active` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `Vehicle` table. All the data in the column will be lost.
  - The `type` column on the `Vehicle` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `AccountPayable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AccountReceivable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Approval` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Commitment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Contract` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Diagnosis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Evidence` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Invoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Maintenance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MaintenanceRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Measurement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseOrder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceInvoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceProvider` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockMovement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockReservation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TechnicalAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TechnicalTimeEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VehicleTimeline` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Warranty` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkItem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cnpj]` on the table `Branch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cnpj]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[plate]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cnpj` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Made the column `document` on table `Company` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `companyId` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brand` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'STOCKIST', 'MECHANIC', 'FINANCIAL', 'ATTENDANT');

-- CreateEnum
CREATE TYPE "OSStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'AWAITING_PARTS', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN');

-- CreateEnum
CREATE TYPE "FinancialType" AS ENUM ('PAYABLE', 'RECEIVABLE');

-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalMethod" AS ENUM ('ASSISTED', 'CUSTOMER_PORTAL', 'DIGITAL_SIGNATURE');

-- AlterEnum
ALTER TYPE "ApprovalStatus" ADD VALUE 'INVALIDATED';

-- AlterEnum
BEGIN;
CREATE TYPE "ClientType_new" AS ENUM ('PERSON', 'COMPANY');
ALTER TABLE "Client" ALTER COLUMN "type" TYPE "ClientType_new" USING ("type"::text::"ClientType_new");
ALTER TYPE "ClientType" RENAME TO "ClientType_old";
ALTER TYPE "ClientType_new" RENAME TO "ClientType";
DROP TYPE "public"."ClientType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_maintenanceId_fkey";

-- DropForeignKey
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_workItemId_fkey";

-- DropForeignKey
ALTER TABLE "Commitment" DROP CONSTRAINT "Commitment_contractId_fkey";

-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Diagnosis" DROP CONSTRAINT "Diagnosis_maintenanceId_fkey";

-- DropForeignKey
ALTER TABLE "Evidence" DROP CONSTRAINT "Evidence_maintenanceId_fkey";

-- DropForeignKey
ALTER TABLE "Evidence" DROP CONSTRAINT "Evidence_userId_fkey";

-- DropForeignKey
ALTER TABLE "Evidence" DROP CONSTRAINT "Evidence_workItemId_fkey";

-- DropForeignKey
ALTER TABLE "Maintenance" DROP CONSTRAINT "Maintenance_contractId_fkey";

-- DropForeignKey
ALTER TABLE "Maintenance" DROP CONSTRAINT "Maintenance_requestId_fkey";

-- DropForeignKey
ALTER TABLE "MaintenanceRequest" DROP CONSTRAINT "MaintenanceRequest_clientId_fkey";

-- DropForeignKey
ALTER TABLE "MaintenanceRequest" DROP CONSTRAINT "MaintenanceRequest_vehicleId_fkey";

-- DropForeignKey
ALTER TABLE "Measurement" DROP CONSTRAINT "Measurement_contractId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseRequest" DROP CONSTRAINT "PurchaseRequest_workItemId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceInvoice" DROP CONSTRAINT "ServiceInvoice_maintenanceId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_stockItemId_fkey";

-- DropForeignKey
ALTER TABLE "StockReservation" DROP CONSTRAINT "StockReservation_stockItemId_fkey";

-- DropForeignKey
ALTER TABLE "StockReservation" DROP CONSTRAINT "StockReservation_workItemId_fkey";

-- DropForeignKey
ALTER TABLE "TechnicalAssignment" DROP CONSTRAINT "TechnicalAssignment_userId_fkey";

-- DropForeignKey
ALTER TABLE "TechnicalAssignment" DROP CONSTRAINT "TechnicalAssignment_workItemId_fkey";

-- DropForeignKey
ALTER TABLE "TechnicalTimeEntry" DROP CONSTRAINT "TechnicalTimeEntry_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "TechnicalTimeEntry" DROP CONSTRAINT "TechnicalTimeEntry_userId_fkey";

-- DropForeignKey
ALTER TABLE "TechnicalTimeEntry" DROP CONSTRAINT "TechnicalTimeEntry_workItemId_fkey";

-- DropForeignKey
ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_branchId_fkey";

-- DropForeignKey
ALTER TABLE "VehicleTimeline" DROP CONSTRAINT "VehicleTimeline_vehicleId_fkey";

-- DropForeignKey
ALTER TABLE "Warranty" DROP CONSTRAINT "Warranty_maintenanceId_fkey";

-- DropForeignKey
ALTER TABLE "WorkItem" DROP CONSTRAINT "WorkItem_maintenanceId_fkey";

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "cnpj" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "whatsapp" TEXT,
ADD COLUMN     "zipCode" TEXT,
ALTER COLUMN "type" SET DEFAULT 'PERSON';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "zipCode" TEXT,
ALTER COLUMN "document" SET NOT NULL;

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "document",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'ATTENDANT';

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "active",
DROP COLUMN "branchId",
ADD COLUMN     "brand" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "engine" TEXT,
ADD COLUMN     "model" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT;

-- DropTable
DROP TABLE "AccountPayable";

-- DropTable
DROP TABLE "AccountReceivable";

-- DropTable
DROP TABLE "Approval";

-- DropTable
DROP TABLE "Commitment";

-- DropTable
DROP TABLE "Contract";

-- DropTable
DROP TABLE "Diagnosis";

-- DropTable
DROP TABLE "Evidence";

-- DropTable
DROP TABLE "Invoice";

-- DropTable
DROP TABLE "Maintenance";

-- DropTable
DROP TABLE "MaintenanceRequest";

-- DropTable
DROP TABLE "Measurement";

-- DropTable
DROP TABLE "PurchaseOrder";

-- DropTable
DROP TABLE "PurchaseRequest";

-- DropTable
DROP TABLE "ServiceInvoice";

-- DropTable
DROP TABLE "ServiceProvider";

-- DropTable
DROP TABLE "StockItem";

-- DropTable
DROP TABLE "StockMovement";

-- DropTable
DROP TABLE "StockReservation";

-- DropTable
DROP TABLE "TechnicalAssignment";

-- DropTable
DROP TABLE "TechnicalTimeEntry";

-- DropTable
DROP TABLE "VehicleTimeline";

-- DropTable
DROP TABLE "Warranty";

-- DropTable
DROP TABLE "WorkItem";

-- DropEnum
DROP TYPE "EvidenceType";

-- DropEnum
DROP TYPE "InvoiceType";

-- DropEnum
DROP TYPE "StockMovementType";

-- DropEnum
DROP TYPE "VehicleType";

-- DropEnum
DROP TYPE "WorkType";

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "internalCode" TEXT,
    "manufacturerCode" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "brand" TEXT,
    "supplierId" TEXT,
    "purchasePrice" DECIMAL(10,2),
    "salePrice" DECIMAL(10,2),
    "price" DECIMAL(10,2),
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "clientId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "mechanicId" TEXT,
    "branchId" TEXT NOT NULL,
    "status" "OSStatus" NOT NULL DEFAULT 'OPEN',
    "totalParts" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalServices" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "finalValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalValue" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OSPart" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OSPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OSService" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OSService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "sourceBranchId" TEXT,
    "targetBranchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialRecord" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "type" "FinancialType" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "date" TIMESTAMP(3),
    "paymentDate" TIMESTAMP(3),
    "categoryId" TEXT,
    "status" "FinancialStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOrderApproval" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "snapshotVersion" INTEGER NOT NULL DEFAULT 1,
    "snapshot" JSONB NOT NULL,
    "totalParts" DECIMAL(12,2) NOT NULL,
    "totalServices" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "finalValue" DECIMAL(12,2) NOT NULL,
    "approvalMethod" "ApprovalMethod" NOT NULL DEFAULT 'ASSISTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectionReason" TEXT,
    "invalidatedAt" TIMESTAMP(3),
    "invalidatedById" TEXT,
    "invalidationReason" TEXT,
    "customerName" TEXT,
    "customerDocument" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceOrderApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Part_internalCode_key" ON "Part"("internalCode");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_partId_branchId_key" ON "Stock"("partId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOrder_number_key" ON "ServiceOrder"("number");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOrder_id_companyId_key" ON "ServiceOrder"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialRecord_id_companyId_key" ON "FinancialRecord"("id", "companyId");

-- CreateIndex
CREATE INDEX "ServiceOrderApproval_companyId_branchId_idx" ON "ServiceOrderApproval"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "ServiceOrderApproval_serviceOrderId_status_idx" ON "ServiceOrderApproval"("serviceOrderId", "status");

-- CreateIndex
CREATE INDEX "ServiceOrderApproval_requestedAt_idx" ON "ServiceOrderApproval"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOrderApproval_serviceOrderId_version_key" ON "ServiceOrderApproval"("serviceOrderId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_cnpj_key" ON "Branch"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_cnpj_key" ON "Supplier"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle"("plate");

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OSPart" ADD CONSTRAINT "OSPart_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OSPart" ADD CONSTRAINT "OSPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OSService" ADD CONSTRAINT "OSService_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_sourceBranchId_fkey" FOREIGN KEY ("sourceBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_targetBranchId_fkey" FOREIGN KEY ("targetBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderApproval" ADD CONSTRAINT "ServiceOrderApproval_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderApproval" ADD CONSTRAINT "ServiceOrderApproval_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderApproval" ADD CONSTRAINT "ServiceOrderApproval_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderApproval" ADD CONSTRAINT "ServiceOrderApproval_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderApproval" ADD CONSTRAINT "ServiceOrderApproval_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderApproval" ADD CONSTRAINT "ServiceOrderApproval_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderApproval" ADD CONSTRAINT "ServiceOrderApproval_invalidatedById_fkey" FOREIGN KEY ("invalidatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
