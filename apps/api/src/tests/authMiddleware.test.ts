import { Request, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../shared/middlewares/authMiddleware';
import { ensureRole } from '../shared/middlewares/ensureRole';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

vi.mock('jsonwebtoken', () => {
  const verify = vi.fn();
  const sign = vi.fn();
  return {
    default: { verify, sign },
    verify,
    sign,
  };
});
vi.mock('../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = vi.fn();

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should return 401 if no authorization header is present', async () => {
      try {
        await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe('JWT token is missing');
      }
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid_token' };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      try {
        await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe('Invalid JWT token');
      }
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if user does not exist in DB', async () => {
      mockRequest.headers = { authorization: 'Bearer valid_token' };
      const decodedPayload = { sub: 'user-id', companyId: 'comp-1', role: 'ADMIN' };
      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      try {
        await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe('User not found or inactive');
      }
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next() if token and user are valid', async () => {
      mockRequest.headers = { authorization: 'Bearer valid_token' };
      const decodedPayload = { sub: 'user-id', companyId: 'comp-1', role: 'ADMIN' };
      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);
      
      const mockUser = { id: 'user-id', companyId: 'comp-1', role: 'ADMIN', active: true, branchId: 'branch-1' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({
        id: 'user-id',
        companyId: 'comp-1',
        role: 'ADMIN',
        branchId: 'branch-1',
      });
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('ensureRole', () => {
    it('should return 403 if user role is not authorized', () => {
      mockRequest.user = { id: '1', companyId: '1', role: 'VIEWER', branchId: undefined };
      const middleware = ensureRole(['ADMIN', 'USER']);

      try {
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
        expect(err.message).toBe('Permission denied');
      }
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next() if user role is authorized', () => {
      mockRequest.user = { id: '1', companyId: '1', role: 'ADMIN', branchId: undefined };
      const middleware = ensureRole(['ADMIN', 'USER']);

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
