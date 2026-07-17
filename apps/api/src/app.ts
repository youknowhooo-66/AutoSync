import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './shared/config/env';
import { errorHandler } from './shared/middlewares/errorHandler';
import { tenantMiddleware } from './shared/middlewares/tenantMiddleware';
import { correlationIdMiddleware } from './shared/middlewares/correlationIdMiddleware';
import { requestLoggerMiddleware } from './shared/middlewares/requestLoggerMiddleware';
import { healthRouter } from './shared/infra/http/health.routes';
import { swaggerSpec } from './shared/infra/http/swagger';

// Module Routes
import { authRoutes } from './modules/auth/routes/auth.routes';
import { clientsRoutes } from './modules/clients/routes/clients.routes';
import { vehiclesRoutes } from './modules/vehicles/routes/vehicles.routes';
import { serviceOrderRouter } from './modules/serviceOrders/routes/serviceOrders.routes';
import { stockRoutes } from './modules/stock/routes/stock.routes';
import { suppliersRoutes } from './modules/stock/routes/suppliers.routes';
import { financialRoutes } from './modules/financial/routes/financial.routes';
import { usersRoutes } from './modules/users/routes/users.routes';
import { companiesRoutes } from './modules/companies/routes/companies.routes';
import { dashboardRouter } from './modules/dashboard/routes/dashboard.routes';
import branchRoutes from './routes/branchRoutes';
import auditRoutes from './routes/auditRoutes';

const app = express();

// ── 1. Correlation ID — must be first so all subsequent logs have the ID ──
app.use(correlationIdMiddleware);

// ── 2. Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ── 3. CORS — restricted to configured origins ───────────────────────────────
// In production/staging CORS_ORIGIN must be explicitly set to the frontend
// domain(s). Comma-separated list is supported.
const corsOrigins = env.CORS_ORIGIN === '*'
  ? '*'
  : env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-company-id',
    'x-tenant-id',
    'x-branch-id',
    'x-correlation-id',
    'Idempotency-Key',
  ],
  exposedHeaders: ['x-correlation-id'],
  credentials: corsOrigins !== '*',
}));

// ── 4. Body parsing and limits ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// ── 5. Request logger — after CORS so OPTIONS pre-flights are also logged ────
app.use(requestLoggerMiddleware);

// ── 6. Rate limiting on all /api routes ─────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes',
    statusCode: 429,
  },
});
app.use('/api/', apiLimiter);

// Stricter limit on authentication endpoints to slow brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.',
    statusCode: 429,
  },
});
app.use('/api/auth/sessions', authLimiter);

// ── 7. API Documentation ─────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── 8. Health routes — PUBLIC, before auth middleware ────────────────────────
// /health/live, /health/ready, /health (deprecated alias)
app.use('/health', healthRouter);

// ── 9. Tenant context ────────────────────────────────────────────────────────
app.use(tenantMiddleware);

// ── 10. Auth routes — public ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── 11. Protected routes — require authentication ────────────────────────────
import { authMiddleware } from './shared/middlewares/authMiddleware';
app.use(authMiddleware);

app.use('/api/clients', clientsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/service-orders', serviceOrderRouter);
app.use('/api/os', serviceOrderRouter); // Alias for frontend
app.use('/api/stock', stockRoutes);
app.use('/api/inventory', stockRoutes); // Alias for frontend
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/finance', financialRoutes); // Alias for frontend
app.use('/api/users', usersRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/audit', auditRoutes);
app.use('/api/auditoria', auditRoutes); // Alias for frontend

// ── 12. Global error handler — must be last ───────────────────────────────────
app.use(errorHandler);

export default app;
