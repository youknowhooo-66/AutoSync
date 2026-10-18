// apps/api/src/modules/auth/controllers/AuthenticateUserController.ts

import { Request, Response } from 'express';
import { authenticateUserSchema } from '../validators/authSchema';
import { container } from '../../../container';
import authConfig from '../../../shared/config/auth';
import { SESSION_COOKIE, durationToMs, sessionCookieOptions } from '../../../shared/http/sessionCookie';

export class AuthenticateUserController {
  async handle(request: Request, response: Response): Promise<Response> {
    const data = authenticateUserSchema.parse(request.body);

    const mappedData = {
      email: data.email,
      password: data.password,
      ...(data.companyId ? { companyId: data.companyId } : {}),
    };

    const authResponse = await container.useCases.identity.authenticateUser.execute(mappedData);

    // The browser keeps the session in an httpOnly cookie. The token stays in the body
    // for non-browser clients (scripts, tests); the web app does not store it.
    response.cookie(SESSION_COOKIE, authResponse.token, sessionCookieOptions(durationToMs(authConfig.jwt.expiresIn)));
    return response.json(authResponse);
  }

  async logout(_request: Request, response: Response): Promise<Response> {
    const { maxAge: _maxAge, ...options } = sessionCookieOptions(0);
    response.clearCookie(SESSION_COOKIE, options);
    return response.status(204).send();
  }
}
