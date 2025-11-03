import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../auth.middleware';
import { AppError } from '../error-handler';

describe('authMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    nextFunction = vi.fn();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('should call next() with error if no authorization header', () => {
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    const error = (nextFunction as any).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Authentication required');
  });

  it('should call next() with error if authorization header does not start with Bearer', () => {
    mockRequest.headers = {
      authorization: 'Invalid token',
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    const error = (nextFunction as any).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
  });

  it('should call next() with error if JWT_SECRET is not configured', () => {
    delete process.env.JWT_SECRET;
    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    const error = (nextFunction as any).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('JWT secret not configured');
  });

  it('should set user data and call next() with valid token', () => {
    process.env.JWT_SECRET = 'test-secret';
    const token = jwt.sign(
      { userId: 'user-1', tenantId: 'tenant-1', role: 'admin' },
      'test-secret'
    );

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.userId).toBe('user-1');
    expect(mockRequest.user).toEqual({
      id: 'user-1',
      tenantId: 'tenant-1',
      role: 'admin',
    });
    expect(nextFunction).toHaveBeenCalledWith();
  });

  it('should call next() with error for invalid token', () => {
    process.env.JWT_SECRET = 'test-secret';
    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    const error = (nextFunction as any).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Invalid or expired token');
  });

  it('should call next() with error for expired token', () => {
    process.env.JWT_SECRET = 'test-secret';
    const token = jwt.sign(
      { userId: 'user-1', tenantId: 'tenant-1', role: 'admin' },
      'test-secret',
      { expiresIn: '-1h' }
    );

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    const error = (nextFunction as any).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
  });
});

