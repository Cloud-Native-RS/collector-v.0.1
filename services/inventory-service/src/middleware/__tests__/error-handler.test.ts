import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../error-handler';

describe('errorHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonSpy: any;
  let statusSpy: any;

  beforeEach(() => {
    mockRequest = {};
    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    };
    nextFunction = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle AppError and return correct status code', () => {
    const error = new AppError('Resource not found', 404);

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(statusSpy).toHaveBeenCalledWith(404);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Resource not found',
        statusCode: 404,
      },
    });
  });

  it('should handle generic Error and return 500', () => {
    const error = new Error('Unexpected error');

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Internal server error',
        statusCode: 500,
      },
    });
    expect(console.error).toHaveBeenCalledWith('Unexpected error:', error);
  });

  it('should handle AppError with default status code 500', () => {
    const error = new AppError('Server error');

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Server error',
        statusCode: 500,
      },
    });
  });
});

