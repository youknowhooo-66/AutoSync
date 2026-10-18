-- AuditLog gains the tenant so the audit screen can be filtered per company.
ALTER TABLE "AuditLog" ADD COLUMN "companyId" TEXT;

UPDATE "AuditLog" a
SET "companyId" = u."companyId"
FROM "User" u
WHERE a."userId" = u."id" AND a."companyId" IS NULL;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId", "createdAt");

-- Every writer only knows the userId; deriving the tenant here means no call site can forget it.
CREATE OR REPLACE FUNCTION audit_log_fill_company() RETURNS trigger AS $$
BEGIN
  IF NEW."companyId" IS NULL THEN
    SELECT u."companyId" INTO NEW."companyId" FROM "User" u WHERE u."id" = NEW."userId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_fill_company
  BEFORE INSERT ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_log_fill_company();
