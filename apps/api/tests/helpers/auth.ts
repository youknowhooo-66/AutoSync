import { sign } from 'jsonwebtoken';
import authConfig from '../../src/shared/config/auth';

interface IUserPayload {
  id: string;
  companyId: string;
  role: string;
  branchId?: string | null;
}

/**
 * Generates a valid JSON Web Token (JWT) signed with the test JWT Secret.
 */
export function generateAuthToken(user: IUserPayload): string {
  const secret = authConfig.jwt.secret;
  
  return sign(
    {
      companyId: user.companyId,
      role: user.role,
      branchId: user.branchId || undefined,
    },
    secret,
    {
      subject: user.id,
      expiresIn: authConfig.jwt.expiresIn,
    }
  );
}

/**
 * Generates an Authorization header with Bearer token.
 */
export function generateAuthHeaders(user: IUserPayload) {
  const token = generateAuthToken(user);
  return {
    Authorization: `Bearer ${token}`,
  };
}
