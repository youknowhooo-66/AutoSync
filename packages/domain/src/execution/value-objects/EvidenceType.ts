/**
 * EvidenceType — classifies the type/moment of an Evidence capture.
 * Source: ERD_DIAGRAM.md and DOMAIN_BLUEPRINT.md
 */
export enum EvidenceType {
  CHECKIN = 'CHECKIN',
  BEFORE = 'BEFORE',
  DURING = 'DURING',
  AFTER = 'AFTER',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  PDF = 'PDF',
}
