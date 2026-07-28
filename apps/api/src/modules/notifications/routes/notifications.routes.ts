import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';
import { rbacMiddleware } from '../../auth/middleware/rbacMiddleware';
import { Permission } from '../../auth/rbac/permissions';
import { NotificationController } from '../controllers/NotificationController';

const notificationRouter = Router();
const controller = new NotificationController();

notificationRouter.use(authMiddleware);

notificationRouter.get('/', rbacMiddleware(Permission.NOTIFICATIONS_READ), (req, res, next) => controller.list(req, res).catch(next));
notificationRouter.patch('/read-all', rbacMiddleware(Permission.NOTIFICATIONS_READ), (req, res, next) => controller.markAllAsRead(req, res).catch(next));
notificationRouter.patch('/:id/read', rbacMiddleware(Permission.NOTIFICATIONS_READ), (req, res, next) => controller.markAsRead(req, res).catch(next));

export { notificationRouter };
