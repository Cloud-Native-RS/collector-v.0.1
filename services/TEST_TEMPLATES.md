# Test Templates

Template fajlovi za brzo kreiranje testova u mikroservisima.

## Service Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { YourService } from '../your.service';
import { AppError } from '../../middleware/error-handler';

const mockPrisma = {
  yourModel: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
} as unknown as PrismaClient;

describe('YourService', () => {
  let service: YourService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new YourService(mockPrisma);
  });

  describe('create', () => {
    it('should create with valid data', async () => {
      // Arrange
      const validData = {
        // ... valid data
        tenantId: 'test-tenant',
      };

      const mockResult = {
        id: 'id-1',
        ...validData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.yourModel.create as any).mockResolvedValue(mockResult);

      // Act
      const result = await service.create(validData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('id-1');
      expect(mockPrisma.yourModel.create).toHaveBeenCalled();
    });

    it('should throw error on invalid data', async () => {
      // Test error cases
      await expect(service.create(invalidData))
        .rejects.toThrow(AppError);
    });
  });

  describe('getById', () => {
    it('should return entity by id and tenant', async () => {
      // Test implementation
    });

    it('should return null if not found', async () => {
      // Test implementation
    });
  });

  // Add more test suites...
});
```

## Middleware Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { yourMiddleware } from '../your.middleware';
import { AppError } from '../error-handler';

describe('yourMiddleware', () => {
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

  it('should call next() on success', () => {
    // Arrange
    mockRequest.headers = {
      // ... valid headers
    };

    // Act
    yourMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assert
    expect(nextFunction).toHaveBeenCalledWith();
  });

  it('should call next() with error on failure', () => {
    // Arrange
    mockRequest.headers = {
      // ... invalid headers
    };

    // Act
    yourMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assert
    expect(nextFunction).toHaveBeenCalled();
    const error = (nextFunction as any).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
  });
});
```

## Utility Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { yourUtilityFunction } from '../your-utility';

describe('yourUtilityFunction', () => {
  it('should handle normal case', () => {
    const input = 'test';
    const result = yourUtilityFunction(input);
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    const input = '';
    const result = yourUtilityFunction(input);
    expect(result).toBeDefined();
  });

  it('should handle error cases', () => {
    expect(() => yourUtilityFunction(null)).toThrow();
  });
});
```

## Route Integration Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { yourRoutes } from '../your.routes';
import { errorHandler } from '../../middleware/error-handler';

describe('Your Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/your', yourRoutes);
    app.use(errorHandler);
  });

  describe('POST /api/your', () => {
    it('should create entity', async () => {
      const response = await request(app)
        .post('/api/your')
        .set('x-tenant-id', 'test-tenant')
        .send({
          // ... valid data
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 400 on invalid data', async () => {
      const response = await request(app)
        .post('/api/your')
        .set('x-tenant-id', 'test-tenant')
        .send({
          // ... invalid data
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without tenant ID', async () => {
      const response = await request(app)
        .post('/api/your')
        .send({
          // ... data
        });

      expect(response.status).toBe(400);
    });
  });
});
```

## Best Practices Checklist

Kada pišete testove, proverite:

- [ ] Svaki test je nezavisan (koristi `beforeEach` sa `vi.clearAllMocks()`)
- [ ] Testovi koriste Arrange-Act-Assert pattern
- [ ] Svi error case-ovi su testirani
- [ ] Multi-tenant izolacija je testirana
- [ ] Mock-ovi su pravilno podešeni
- [ ] Async operacije koriste `await`
- [ ] Test imena su deskriptivna
- [ ] Testovi su brzi (ne koriste pravu bazu)

## Copy-Paste Checklist

Kada kopirate template:

1. Zamenite `YourService` sa stvarnim imenom servisa
2. Zamenite `yourModel` sa stvarnim Prisma modelom
3. Dodajte sve metode iz servisa
4. Implementirajte test cases za sve scenarije
5. Dodajte tenant isolation testove
6. Testirajte error handling

