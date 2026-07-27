/**
 * normalizeInternalCode
 *
 * Normalizes an internal part code for case-insensitive, whitespace-agnostic
 * uniqueness comparison within a company.
 *
 * Rules:
 * - Trims leading and trailing whitespace
 * - Converts to lowercase using locale-aware comparison (pt-BR)
 * - Returns null if the result is empty or input is null/undefined
 *
 * This value is stored in `Part.normalizedInternalCode` and used by the
 * @@unique([companyId, normalizedInternalCode]) constraint.
 *
 * Usage:
 *   normalizeInternalCode('  PRT-001  ') // => 'prt-001'
 *   normalizeInternalCode(null)          // => null
 *   normalizeInternalCode('')            // => null
 */
export function normalizeInternalCode(value?: string | null): string | null {
  if (value === null || value === undefined) return null;
  const normalized = value.trim().toLocaleLowerCase('pt-BR');
  return normalized.length > 0 ? normalized : null;
}
