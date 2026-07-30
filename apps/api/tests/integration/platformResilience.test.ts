/**
 * platformResilience.test.ts
 *
 * Tests for platform observability contracts:
 *  - liveness does NOT call HealthService or Prisma
 *  - readiness returns 200 with checks when ready
 *  - readiness returns 503 when database is down (via HealthService stub)
 *  - readiness returns 200 when redis is degraded (degradable)
 *  - readiness returns 503 during shutting_down state
 *  - correlation ID propagation from valid header
 *  - correlation ID generation when header is absent or invalid
 *  - error responses include correlationId in envelope
 *
 * These tests use stubs on HealthService — NOT on Prisma or real containers.
 * Chaos tests (stopping real containers) are in certify-p6.sh --allow-disruption.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { applicationState } from '../../src/shared/health/ApplicationState';
import * as HealthServiceModule from '../../src/shared/health/HealthService';

// ── Liveness ─────────────────────────────────────────────────────────────────
describe('GET /health/live', () => {
  it('returns 200 with required fields', async () => {
    // Spy on HealthService.getReadiness to confirm liveness never calls it.
    const getReadinessSpy = vi.spyOn(HealthServiceModule.healthService, 'getReadiness');

    const res = await request(app).get('/health/live');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('autosync-api');
    expect(typeof res.body.uptimeSeconds).toBe('number');
    expect(res.body.timestamp).toBeDefined();
    // Liveness must NOT call readiness / dependency checks.
    expect(getReadinessSpy).not.toHaveBeenCalled();

    getReadinessSpy.mockRestore();
  });

  it('always includes x-correlation-id in response headers', async () => {
    const res = await request(app).get('/health/live');
    expect(res.headers['x-correlation-id']).toBeDefined();
    expect(typeof res.headers['x-correlation-id']).toBe('string');
  });
});

// ── GET /health (deprecated alias) ──────────────────────────────────────────
describe('GET /health', () => {
  it('returns 200 with status ok (backwards compat)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── Readiness ─────────────────────────────────────────────────────────────────
describe('GET /health/ready', () => {
  beforeEach(() => {
    applicationState.setReady();
  });

  afterEach(() => {
    applicationState.setReady();
    vi.restoreAllMocks();
  });

  it('returns 200 with checks when dependencies are up', async () => {
    vi.spyOn(HealthServiceModule.healthService, 'getReadiness').mockResolvedValue({
      status: 'ready',
      checks: { database: 'up', redis: 'up' },
      timestamp: new Date().toISOString(),
    });

    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.checks.database).toBe('up');
    expect(res.body.checks.redis).toBe('up');
  });

  it('returns 503 when database check reports down', async () => {
    vi.spyOn(HealthServiceModule.healthService, 'getReadiness').mockResolvedValue({
      status: 'not_ready',
      checks: { database: 'down', redis: 'up' },
      timestamp: new Date().toISOString(),
    });

    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('not_ready');
    expect(res.body.checks.database).toBe('down');
  });

  it('returns 200 when redis is degraded but database is up', async () => {
    vi.spyOn(HealthServiceModule.healthService, 'getReadiness').mockResolvedValue({
      status: 'ready',
      checks: { database: 'up', redis: 'degraded' },
      timestamp: new Date().toISOString(),
    });

    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.checks.redis).toBe('degraded');
  });

  it('returns 503 during shutting_down without calling HealthService', async () => {
    const getReadinessSpy = vi.spyOn(HealthServiceModule.healthService, 'getReadiness');
    applicationState.setShuttingDown();

    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('not_ready');
    expect(res.body.reason).toBe('shutting_down');
    expect(getReadinessSpy).not.toHaveBeenCalled();
  });

  it('returns 503 during starting state without calling HealthService', async () => {
    const getReadinessSpy = vi.spyOn(HealthServiceModule.healthService, 'getReadiness');
    // @ts-expect-error — internal access to set 'starting' state for test
    applicationState['state'] = 'starting';

    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(503);
    expect(res.body.reason).toBe('starting');
    expect(getReadinessSpy).not.toHaveBeenCalled();
  });
});

// ── Correlation ID propagation ─────────────────────────────────────────────
describe('Correlation ID middleware', () => {
  it('propagates a valid UUID from x-correlation-id header', async () => {
    const correlationId = '550e8400-e29b-41d4-a716-446655440000';
    const res = await request(app)
      .get('/health/live')
      .set('x-correlation-id', correlationId);

    expect(res.headers['x-correlation-id']).toBe(correlationId);
  });

  it('generates a new UUID when header is absent', async () => {
    const res = await request(app).get('/health/live');
    const id = res.headers['x-correlation-id'];
    expect(id).toBeDefined();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('generates a new UUID when header value is not a valid UUID', async () => {
    const res = await request(app)
      .get('/health/live')
      .set('x-correlation-id', 'not-a-valid-uuid!!');

    const id = res.headers['x-correlation-id'];
    expect(id).not.toBe('not-a-valid-uuid!!');
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('generates a new UUID when header exceeds 100 characters', async () => {
    const longId = 'a'.repeat(101);
    const res = await request(app)
      .get('/health/live')
      .set('x-correlation-id', longId);

    const id = res.headers['x-correlation-id'];
    expect(id).not.toBe(longId);
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('correlation ID is consistent across request and response header', async () => {
    const correlationId = '550e8400-e29b-41d4-a716-446655440001';
    const res = await request(app)
      .get('/health/live')
      .set('x-correlation-id', correlationId);

    // Should appear in response header.
    expect(res.headers['x-correlation-id']).toBe(correlationId);
  });
});

// ── Error envelope ────────────────────────────────────────────────────────────
describe('Error envelope — correlation ID in error responses', () => {
  it('error response includes x-correlation-id in header', async () => {
    const correlationId = '550e8400-e29b-41d4-a716-446655440002';
    // POST to login with invalid credentials to trigger a 4xx.
    const res = await request(app)
      .post('/api/auth/sessions')
      .set('x-correlation-id', correlationId)
      .send({ email: 'nobody@nowhere.invalid', password: 'wrong' });

    expect(res.headers['x-correlation-id']).toBe(correlationId);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('liveness always includes correlation header even without x-correlation-id', async () => {
    const res = await request(app).get('/health/live');
    expect(res.headers['x-correlation-id']).toBeDefined();
  });
});

// ── HealthService unit tests ──────────────────────────────────────────────────
describe('HealthService — checkRedis', () => {
  it('returns "up" or "degraded" — never throws', async () => {
    const { HealthService } = await import('../../src/shared/health/HealthService');
    const hs = new HealthService();
    const result = await hs.checkRedis();
    expect(['up', 'degraded']).toContain(result);
  });
});
