import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './shared/middlewares/errorHandler';
import { tenantMiddleware } from './shared/middlewares/tenantMiddleware';
import { swaggerSpec } from './shared/infra/http/swagger';

// New Module Routes
import { authRoutes } from './modules/auth/routes/auth.routes';
import { clientsRoutes } from './modules/clients/routes/clients.routes';
import { vehiclesRoutes } from './modules/vehicles/routes/vehicles.routes';
import { serviceOrdersRoutes } from './modules/serviceOrders/routes/serviceOrders.routes';
import { stockRoutes } from './modules/stock/routes/stock.routes';
import { financialRoutes } from './modules/financial/routes/financial.routes';
import { usersRoutes } from './modules/users/routes/users.routes';
import { companiesRoutes } from './modules/companies/routes/companies.routes';

dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id']
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

// Routes registration
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/service-orders', serviceOrdersRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/companies', companiesRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handler
app.use(errorHandler);

export default app;
