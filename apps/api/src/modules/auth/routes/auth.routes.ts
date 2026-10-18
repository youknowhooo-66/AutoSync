// apps/api/src/modules/auth/routes/auth.routes.ts

import { Router } from 'express';
import { authenticateUserController } from '../index';

const authRoutes = Router();

authRoutes.post('/sessions', (req, res) => authenticateUserController.handle(req, res));
authRoutes.post('/login', (req, res) => authenticateUserController.handle(req, res));
authRoutes.post('/logout', (req, res) => authenticateUserController.logout(req, res));

export { authRoutes };
