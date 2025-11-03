import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { tenantMiddleware } from '../tenant.middleware';
import { AppError } from '../error-handler';

describe('tenantMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    nextFunction = vi.fn();
  });

  it('should extract tenant ID from header and call next()', () => {
    mockRequest.headers = {
      'x-tenant-id': 'test-tenant-123',
    };

    tenantMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.tenantId).toBe('test-tenant-123');
    expect(nextFunction).toHaveBeenCalledWith();
  });

  it('should use default tenant if no header provided', () => {
    tenantMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.tenantId).toBe('default-tenant');
    expect(nextFunction).toHaveBeenCalledWith();
  });

  it('should call next() with error if tenant ID is empty string', () => {
    mockRequest.headers = {
      'x-tenant-id': '',
    };

    tenantMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    const error = (nextFunction as any).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Tenant ID is required');
  });
});

