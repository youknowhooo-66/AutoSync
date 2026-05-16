import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './shared/middlewares/errorHandler';
import { tenantMiddleware } from './shared/middlewares/tenantMiddleware';
import { swaggerSpec } from './shared/infra/http/swagger';

// New Module Routes
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
import auditRoutes from './routes/auditRoutes';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'authorization', 'x-company-id', 'x-tenant-id', 'X-Tenant-Id', 'x-branch-id']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes',
    statusCode: 429
  }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Custom Middlewares
app.use(tenantMiddleware);

// Public Routes
app.use('/api/auth', authRoutes);
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// Protected Routes (Global Auth)
import { authMiddleware } from './shared/middlewares/authMiddleware';
app.use(authMiddleware);

// Routes registration
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
app.use('/api/branches', companiesRoutes); // Alias for frontend
app.use('/api/dashboard', dashboardRouter);
app.use('/api/audit', auditRoutes);
app.use('/api/auditoria', auditRoutes); // Alias for frontend

// Error Handler
app.use(errorHandler);

export default app;
