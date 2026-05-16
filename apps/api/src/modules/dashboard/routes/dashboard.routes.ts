import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';
import { rbacMiddleware } from '../../../modules/auth/middleware/rbacMiddleware';
import { Permission } from '../../../modules/auth/rbac/permissions';

const dashboardRouter = Router();
const controller = new DashboardController();

dashboardRouter.use(authMiddleware);

dashboardRouter.get(
  '/metrics', 
  rbacMiddleware(Permission.FINANCIAL_VIEW), 
  controller.getMetrics
);

dashboardRouter.get(
  '/', 
  rbacMiddleware(Permission.FINANCIAL_VIEW), 
  controller.getMetrics
);

export { dashboardRouter };
