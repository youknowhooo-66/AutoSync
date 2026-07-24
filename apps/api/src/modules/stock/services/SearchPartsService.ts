/**
 * SearchPartsService
 *
 * Implements the catalog search endpoint (GET /api/inventory/parts).
 *
 * Search strategy:
 *   - TRIGRAM mode (default): uses pg_trgm similarity() for partial/fuzzy search on name,
 *     brand and description. Requires the pg_trgm extension to be installed.
 *   - PREFIX mode (SEARCH_MODE=PREFIX env var): falls back to LIKE 'term%' prefix matching
 *     without trigram. Exact code matches always work in both modes.
 *
 * Architecture:
 *   - Uses a CTE (WITH clause) to first compute per-part max relevance across stock rows,
 *     then applies ORDER BY, pagination and filtering safely.
 *   - Stock join is optional; when branchId is provided the quantities are scoped to that branch.
 *
 * Multi-tenancy: always scoped by companyId from the authenticated user.
 */

import { Prisma } from '@prisma/client';
import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';

export type SortBy = 'RELEVANCE' | 'NAME' | 'SKU' | 'AVAILABLE_QUANTITY';
export type SortOrder = 'asc' | 'desc';
export type AvailabilityFilter = 'ALL' | 'AVAILABLE' | 'OUT_OF_STOCK';

export interface SearchPartsInput {
  companyId: string;
  q?: string;
  page: number;
  pageSize: number;
  availability: AvailabilityFilter;
  sortBy: SortBy;
  sortOrder?: SortOrder;
  branchId?: string;
}

export interface PartSearchItem {
  id: string;
  name: string;
  sku: string | null;
  manufacturerCode: string | null;
  barcode: string | null;
  brand: string | null;
  description: string | null;
  category: string | null;
  unit: string | null;
  onHandQuantity: string;
  reservedQuantity: string;
  availableQuantity: string;
  location: string | null;
  averageCost: string | null;
  /** Catalog sale price (salePrice field on Part). Use as primary price reference when available. */
  salePrice: string | null;
  canSelectFromStock: boolean;
  active: boolean;
}

export interface SearchPartsResult {
  items: PartSearchItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Detect pg_trgm availability at runtime.
 * Uses a Promise-based cache to prevent concurrent detections from firing
 * multiple DB queries simultaneously.
 * Can be overridden via SEARCH_MODE=PREFIX environment variable.
 */
let trigramDetectionPromise: Promise<boolean> | undefined;

async function isTrigramMode(): Promise<boolean> {
  // Allow explicit override via env var
  if (process.env['SEARCH_MODE'] === 'PREFIX') return false;

  // Return shared in-flight or resolved promise to prevent race conditions
  if (trigramDetectionPromise !== undefined) return trigramDetectionPromise;

  trigramDetectionPromise = (async () => {
    try {
      const result = await prismaClient.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count FROM pg_extension WHERE extname = 'pg_trgm'
      `;
      return Number(result[0]?.count ?? 0) > 0;
    } catch {
      // pg_trgm not available — degrade gracefully to PREFIX mode
      return false;
    }
  })();

  return trigramDetectionPromise;
}

export class SearchPartsService {
  async execute(input: SearchPartsInput): Promise<SearchPartsResult> {
    const { companyId, q, page, pageSize, availability, sortBy, sortOrder, branchId } = input;

    if (!companyId) {
      throw new AppError('companyId is required', 400);
    }

    const term = q ? q.trim() : undefined;
    const offset = (page - 1) * pageSize;

    // Determine search mode dynamically (detects pg_trgm availability)
    const TRIGRAM_MODE = await isTrigramMode();

    // ─── Build filter expressions ──────────────────────────────────────────────
    let termFilter: Prisma.Sql;
    let relevanceExpr: Prisma.Sql;


    if (term) {
      const termLower = term.toLowerCase();
      const prefixLike = `${termLower}%`;

      if (TRIGRAM_MODE) {
        termFilter = Prisma.sql`AND (
          lower(p."name") LIKE ${prefixLike}
          OR lower(COALESCE(p."internalCode", '')) = ${termLower}
          OR lower(COALESCE(p."manufacturerCode", '')) = ${termLower}
          OR lower(COALESCE(p."barcode", '')) = ${termLower}
          OR similarity(p."name", ${term}) > 0.1
          OR similarity(COALESCE(p."brand", ''), ${term}) > 0.15
          OR similarity(COALESCE(p."description", ''), ${term}) > 0.15
        )`;

        relevanceExpr = Prisma.sql`
          CASE
            WHEN lower(COALESCE(p."internalCode", '')) = ${termLower} THEN 1000
            WHEN lower(COALESCE(p."manufacturerCode", '')) = ${termLower} THEN 950
            WHEN lower(COALESCE(p."barcode", '')) = ${termLower} THEN 925
            WHEN lower(p."name") = ${termLower} THEN 900
            WHEN lower(p."name") LIKE ${prefixLike} THEN 800
            WHEN lower(COALESCE(p."brand", '')) = ${termLower} THEN 750
            ELSE GREATEST(
              similarity(p."name", ${term}) * 500,
              similarity(COALESCE(p."brand", ''), ${term}) * 350,
              similarity(COALESCE(p."description", ''), ${term}) * 200
            )
          END
        `;
      } else {
        // PREFIX mode: no similarity() calls
        termFilter = Prisma.sql`AND (
          lower(p."name") LIKE ${prefixLike}
          OR lower(COALESCE(p."internalCode", '')) = ${termLower}
          OR lower(COALESCE(p."manufacturerCode", '')) = ${termLower}
          OR lower(COALESCE(p."barcode", '')) = ${termLower}
          OR lower(COALESCE(p."brand", '')) LIKE ${prefixLike}
        )`;

        relevanceExpr = Prisma.sql`
          CASE
            WHEN lower(COALESCE(p."internalCode", '')) = ${termLower} THEN 1000
            WHEN lower(COALESCE(p."manufacturerCode", '')) = ${termLower} THEN 950
            WHEN lower(COALESCE(p."barcode", '')) = ${termLower} THEN 925
            WHEN lower(p."name") = ${termLower} THEN 900
            WHEN lower(p."name") LIKE ${prefixLike} THEN 800
            WHEN lower(COALESCE(p."brand", '')) = ${termLower} THEN 750
            ELSE 0
          END
        `;
      }
    } else {
      termFilter = Prisma.sql``;
      relevanceExpr = Prisma.sql`0`;
    }

    // ─── Availability filter ───────────────────────────────────────────────────
    let availabilityFilter: Prisma.Sql;
    if (availability === 'AVAILABLE') {
      availabilityFilter = Prisma.sql`AND (COALESCE(s."quantity", 0) - COALESCE(s."reservedQuantity", 0)) > 0`;
    } else if (availability === 'OUT_OF_STOCK') {
      availabilityFilter = Prisma.sql`AND (COALESCE(s."quantity", 0) - COALESCE(s."reservedQuantity", 0)) <= 0`;
    } else {
      availabilityFilter = Prisma.sql``;
    }

    // ─── Stock JOIN ────────────────────────────────────────────────────────────
    const stockJoin = branchId
      ? Prisma.sql`LEFT JOIN "Stock" s ON s."partId" = p.id AND s."branchId" = ${branchId} AND s."companyId" = ${companyId}`
      : Prisma.sql`LEFT JOIN "Stock" s ON s."partId" = p.id AND s."companyId" = ${companyId}`;

    // ─── ORDER BY expression (used inside the CTE's outer query) ──────────────
    const isDesc =
      sortOrder === 'desc' || (sortOrder === undefined && sortBy === 'RELEVANCE');

    const orderByDir = isDesc ? Prisma.sql`DESC` : Prisma.sql`ASC`;

    let orderByExpr: Prisma.Sql;
    switch (sortBy) {
      case 'RELEVANCE':
        // id as tiebreaker ensures deterministic pagination when scores are equal
        orderByExpr = term
          ? Prisma.sql`relevance ${orderByDir}, lower(name) ASC, id ASC`
          : Prisma.sql`lower(name) ASC, id ASC`;
        break;
      case 'NAME':
        orderByExpr = Prisma.sql`lower(name) ${orderByDir}, id ASC`;
        break;
      case 'SKU':
        orderByExpr = Prisma.sql`lower(COALESCE(sku, '')) ${orderByDir}, id ASC`;
        break;
      case 'AVAILABLE_QUANTITY':
        orderByExpr = Prisma.sql`available_quantity ${orderByDir}, id ASC`;
        break;
      default:
        orderByExpr = Prisma.sql`lower(name) ASC, id ASC`;
    }

    // ─── Count query ───────────────────────────────────────────────────────────
    // Uses a sub-query with DISTINCT to count unique parts matching the filters
    const countResult = await prismaClient.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT p.id)::bigint AS count
      FROM "Part" p
      ${stockJoin}
      WHERE p."companyId" = ${companyId}
        AND p."active" = true
        ${termFilter}
        ${availabilityFilter}
    `;

    const total = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / pageSize);

    if (total === 0) {
      return { items: [], total: 0, page, pageSize, totalPages: 0 };
    }

    // ─── Data query (CTE pattern) ──────────────────────────────────────────────
    // Step 1: base_parts CTE — deduplicate parts and compute max relevance + aggregated stock
    // Step 2: apply ORDER BY + LIMIT/OFFSET on the CTE output
    type RawPartRow = {
      id: string;
      name: string;
      sku: string | null;
      manufacturer_code: string | null;
      barcode: string | null;
      brand: string | null;
      description: string | null;
      category: string | null;
      active: boolean;
      on_hand_quantity: string;
      reserved_quantity: string;
      available_quantity: string;
      location: string | null;
      average_cost: string | null;
      sale_price: string | null;
      relevance: string;
    };

    const rows = await prismaClient.$queryRaw<RawPartRow[]>`
      WITH base_parts AS (
        SELECT
          p.id,
          p.name,
          p."internalCode"                                         AS sku,
          p."manufacturerCode"                                     AS manufacturer_code,
          p."barcode"                                              AS barcode,
          p."brand"                                                AS brand,
          p."description"                                          AS description,
          p."category"                                             AS category,
          p."active"                                               AS active,
          -- Aggregate stock quantities (SUM for multi-branch, single value for branch-scoped join)
          COALESCE(MAX(s."quantity"), 0)                           AS on_hand_quantity,
          COALESCE(MAX(s."reservedQuantity"), 0)                   AS reserved_quantity,
          COALESCE(MAX(s."quantity"), 0)
            - COALESCE(MAX(s."reservedQuantity"), 0)               AS available_quantity,
          MAX(s."location")                                        AS location,
          MAX(s."averageCost")                                     AS average_cost,
          p."salePrice"                                            AS sale_price,
          MAX(${relevanceExpr})                                    AS relevance
        FROM "Part" p
        ${stockJoin}
        WHERE p."companyId" = ${companyId}
          AND p."active" = true
          ${termFilter}
          ${availabilityFilter}
        GROUP BY p.id, p.name, p."internalCode", p."manufacturerCode",
                 p."barcode", p."brand", p."description", p."category", p."active",
                 p."salePrice"
      )
      SELECT *
      FROM base_parts
      ORDER BY ${orderByExpr}
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    const items: PartSearchItem[] = rows.map((row) => {
      const onHand = new Prisma.Decimal(row.on_hand_quantity || '0');
      const reserved = new Prisma.Decimal(row.reserved_quantity || '0');
      const available = new Prisma.Decimal(row.available_quantity || '0');

      return {
        id: row.id,
        name: row.name,
        sku: row.sku,
        manufacturerCode: row.manufacturer_code,
        barcode: row.barcode,
        brand: row.brand,
        description: row.description,
        category: row.category,
        unit: null, // reserved for future Part.unit field
        onHandQuantity: onHand.toFixed(3),
        reservedQuantity: reserved.toFixed(3),
        availableQuantity: available.toFixed(3),
        location: row.location,
        averageCost: row.average_cost
          ? new Prisma.Decimal(row.average_cost).toFixed(2)
          : null,
        salePrice: row.sale_price
          ? new Prisma.Decimal(row.sale_price).toFixed(2)
          : null,
        canSelectFromStock: available.greaterThan(new Prisma.Decimal(0)),
        active: row.active,
      };
    });

    return { items, total, page, pageSize, totalPages };
  }
}
