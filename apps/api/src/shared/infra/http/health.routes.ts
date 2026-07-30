/**
 * Health Routes — liveness and readiness probes.
 *
 * GET /health/live   — shallow liveness: confirms the Node process responds.
 *                      Must NOT query any external dependency.
 * GET /health/ready  — deep readiness: validates PostgreSQL and Redis.
 *                      Returns 503 if database is unavailable.
 * GET /health        — deprecated alias for /health/live (backwards compat).
 */
import { Router } from 'express';
import { applicationState } from '../../health/ApplicationState';
import { healthService } from '../../health/HealthService';

const healthRouter = Router();

const APP_VERSION = process.env.APP_VERSION ?? process.env.GIT_SHA ?? 'unknown';
const SERVICE_NAME = 'autosync-api';

// ── Liveness ────────────────────────────────────────────────────────────────
// Must answer even during graceful shutdown so the orchestrator can observe
// the process is still responding. Never checks external dependencies.
healthRouter.get('/live', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: SERVICE_NAME,
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// ── Readiness ───────────────────────────────────────────────────────────────
// Returns 503 while the application is starting or shutting down, or when
// a mandatory dependency (database) is unreachable.
healthRouter.get('/ready', async (_req, res) => {
  const state = applicationState.getState();

  if (state === 'starting' || state === 'shutting_down') {
    return res.status(503).json({
      status: 'not_ready',
      reason: state,
      checks: { database: 'unknown', redis: 'unknown' },
      timestamp: new Date().toISOString(),
    });
  }

  const result = await healthService.getReadiness();
  const httpStatus = result.status === 'ready' ? 200 : 503;
  return res.status(httpStatus).json(result);
});

// ── Deprecated alias ────────────────────────────────────────────────────────
// Kept for Docker healthchecks and legacy callers. Behaves identically to
// /health/live. Will be removed once all callers are updated.
healthRouter.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: SERVICE_NAME,
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

export { healthRouter };
