import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, AuthRequest } from '../middlewares/authMiddleware';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

jest.mock('jsonwebtoken');
jest.mock('../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should return 401 if no authorization header is present', async () => {
      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Token de autenticação não fornecido.' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid_token' };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Token inválido ou expirado.' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if user does not exist in DB', async () => {
      mockRequest.headers = { authorization: 'Bearer valid_token' };
      const decodedPayload = { id: 'user-id', email: 'test@test.com', role: 'ADMIN' };
      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-id' } });
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Usuário não encontrado ou inativo.' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next() if token and user are valid', async () => {
      mockRequest.headers = { authorization: 'Bearer valid_token' };
      const decodedPayload = { id: 'user-id', email: 'test@test.com', role: 'ADMIN' };
      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);
      
      const mockUser = { id: 'user-id', email: 'test@test.com', role: 'ADMIN', active: true, branchId: 'branch-1' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({
        id: 'user-id',
        email: 'test@test.com',
        role: 'ADMIN',
        branchId: 'branch-1',
      });
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should return 403 if user role is not authorized', () => {
      mockRequest.user = { id: '1', email: 'a@a.com', role: 'ATTENDANT', branchId: null };
      const middleware = authorize('ADMIN', 'MANAGER');

      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Acesso negado. Permissão insuficiente.' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next() if user role is authorized', () => {
      mockRequest.user = { id: '1', email: 'a@a.com', role: 'ADMIN', branchId: null };
      const middleware = authorize('ADMIN', 'MANAGER');

      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
