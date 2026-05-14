import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from '../shared/middlewares/errorHandler';
import { tenantMiddleware } from '../shared/middlewares/tenantMiddleware';

// Routes
import authRoutes from './routes/authRoutes';
import branchRoutes from './routes/branchRoutes';
import { clientRoutes } from './modules/clients/routes/clientRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import osRoutes from './routes/osRoutes';
import financialRoutes from './routes/financialRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import userRoutes from './routes/userRoutes';
import supplierRoutes from './routes/supplierRoutes';
import auditRoutes from './routes/auditRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

dotenv.config();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Custom Middlewares
app.use(tenantMiddleware);

// Routes registration
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/os', osRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handler
app.use(errorHandler);

export default app;
