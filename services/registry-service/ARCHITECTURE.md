# Registry Service Architecture

## Overview

The Customer & Company Registry Microservice follows a **Clean Architecture** pattern with domain-driven design principles. It provides a centralized, authoritative source of truth for all customer and company master data.

## Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                   API Layer                         │
│  (Express Routes, Request/Response Handlers)       │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                Middleware Layer                     │
│  (Auth, Tenant Isolation, Error Handling)          │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Service Layer                          │
│  (Business Logic, Validation, Data Processing)     │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Data Access Layer                      │
│  (Prisma ORM, Database Queries)                    │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Database Layer                         │
│  (PostgreSQL)                                       │
└─────────────────────────────────────────────────────┘
```

## Components

### 1. API Layer (`src/routes/`)

**Purpose**: Handle HTTP requests and responses

**Responsibilities**:
- Route definition and registration
- Request parameter extraction
- Response formatting
- HTTP status codes

**Files**:
- `customer.routes.ts` - Customer CRUD operations
- `company.routes.ts` - Company CRUD operations
- `lookup.routes.ts` - Lookup/search endpoints

### 2. Middleware Layer (`src/middleware/`)

**Purpose**: Cross-cutting concerns and security

**Components**:
- **Auth Middleware**: JWT token validation
- **Tenant Middleware**: Multi-tenant isolation
- **Error Handler**: Centralized error handling

### 3. Service Layer (`src/services/`)

**Purpose**: Business logic and domain rules

**Responsibilities**:
- Data validation
- Business rule enforcement
- Duplicate prevention
- Transaction orchestration
- Number generation

**Services**:
- `CustomerService` - Customer management logic
- `CompanyService` - Company management logic

### 4. Data Access Layer

**Technology**: Prisma ORM

**Responsibilities**:
- Database schema definition
- Query generation
- Migration management
- Type-safe database access

## Data Models

### Customer Entity

```typescript
{
  id: UUID
  type: INDIVIDUAL | COMPANY
  customerNumber: string (unique)
  firstName?: string
  lastName?: string
  companyName?: string
  email: string (unique)
  phone?: string
  taxId: string (unique)
  registrationNumber?: string
  status: ACTIVE | INACTIVE | PENDING | ARCHIVED
  addressId: UUID → Address
  contactId: UUID → Contact
  bankAccountId?: UUID → BankAccount
  tenantId: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Company Entity

```typescript
{
  id: UUID
  companyType: CORPORATION | LLC | LTD | GMBH | SARL | OTHER
  companyNumber: string (unique)
  legalName: string (unique)
  tradingName?: string
  taxId: string (unique)
  registrationNumber: string (unique)
  industry?: string
  legalRepName?: string
  legalRepTitle?: string
  legalRepEmail?: string
  legalRepPhone?: string
  status: ACTIVE | INACTIVE | PENDING | LIQUIDATED
  addressId: UUID → Address
  contactId: UUID → Contact
  bankAccountId?: UUID → BankAccount
  tenantId: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Multi-Tenant Architecture

### Tenant Isolation Strategy

The service uses **Logical Separation** with a `tenantId` field:

```typescript
// Every query is filtered by tenant
const customer = await prisma.customer.findFirst({
  where: {
    id: customerId,
    tenantId: request.tenantId
  }
});
```

### Tenant Context

The tenant ID is extracted from:
1. JWT token (production)
2. HTTP header `x-tenant-id` (development)

### Benefits

- ✅ Simple implementation
- ✅ Shared database, reduced costs
- ✅ Easy cross-tenant reporting
- ✅ Efficient resource utilization

### Considerations

- Must ensure all queries include tenant filter
- Careful with database migrations
- Index on `tenantId` for performance

## Security Architecture

### Authentication Flow

```
Client → [JWT Token] → Auth Middleware → Extract User/Tenant → Service Layer
```

### Authorization

Currently all authenticated users can access their tenant's data. Future enhancements:
- Role-Based Access Control (RBAC)
- Fine-grained permissions per resource

### Data Encryption

- **At Rest**: Database-level encryption (PostgreSQL TDE)
- **In Transit**: HTTPS/TLS
- **Sensitive Fields**: IBAN, SWIFT codes should be encrypted before storage

## Validation Strategy

### Input Validation

**Layer 1: Schema Validation (Zod)**
```typescript
const schema = z.object({
  email: z.string().email(),
  taxId: z.string().min(5)
});
```

**Layer 2: Business Logic Validation**
```typescript
// Check for duplicates
const existing = await prisma.customer.findUnique({
  where: { email: data.email }
});
```

### Validation Rules

| Field | Rules |
|-------|-------|
| Tax ID | Country-specific format validation |
| Email | Format + uniqueness per tenant |
| IBAN | ISO 13616 format |
| SWIFT | ISO 9362 format |
| Phone | Flexible format (optional) |

## Error Handling Strategy

### Error Types

1. **Validation Errors (400)** - Invalid input
2. **Authentication Errors (401)** - Missing/invalid token
3. **Authorization Errors (403)** - Insufficient permissions
4. **Not Found (404)** - Resource doesn't exist
5. **Duplicate (409)** - Resource already exists
6. **Server Errors (500)** - Unexpected errors

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Customer with this email already exists",
    "statusCode": 400
  }
}
```

## Caching Strategy (Future)

### Redis Integration

**Cache Keys**:
```
customer:{tenantId}:{id}
company:{tenantId}:{id}
lookup:customer:{tenantId}:{taxId}
```

**TTL**: 1 hour for reads, immediate invalidation on writes

## Performance Considerations

### Database Indexes

```prisma
@@index([tenantId])
@@index([taxId])
@@index([email])
@@index([customerNumber])
```

### Query Optimization

- Use `select` to fetch only needed fields
- Implement pagination for list endpoints
- Consider read replicas for heavy read traffic

### Connection Pooling

Prisma automatically handles connection pooling with sensible defaults.

## Scalability

### Horizontal Scaling

The service is stateless and can be scaled horizontally:
- Multiple instances behind a load balancer
- Shared database ensures consistency
- Redis cache can be shared or distributed

### Vertical Scaling

- Increase database resources
- Add read replicas
- Optimize queries

## Deployment

### Container Architecture

```
┌─────────────────────────────────────────┐
│       Load Balancer / API Gateway      │
└────────┬────────────────────────────┬────┘
         │                            │
    ┌────▼────┐                   ┌───▼────┐
    │Service 1│                   │Service2│
    └────┬────┘                   └───┬────┘
         │                            │
         └────────┬───────────────────┘
                  │
            ┌─────▼──────┐
            │ PostgreSQL │
            └────────────┘
```

### Health Checks

- `/health` endpoint for load balancer
- Database connectivity check
- Readiness probe

## Testing Strategy

### Unit Tests

- Service layer logic
- Validation functions
- Utility functions

### Integration Tests

- API endpoints
- Database operations
- Full request/response cycle

### E2E Tests (Future)

- Complete user workflows
- Cross-service integration

## Observability

### Logging

- Request/response logging via Morgan
- Error logging to console
- Structured logging (future: JSON format)

### Metrics (Future)

- Request count
- Response times
- Error rates
- Database query performance

### Tracing (Future)

- Distributed tracing with OpenTelemetry
- Request correlation IDs

## Future Enhancements

1. **Event-Driven Architecture** - Publish events on data changes
2. **GraphQL API** - Flexible querying for complex requirements
3. **Batch Operations** - Bulk import/export
4. **Soft Deletes** - Archive instead of delete
5. **Audit Trail** - Track all changes with timestamps and user IDs
6. **Versioning** - API version management
7. **Rate Limiting** - Prevent abuse
8. **Webhooks** - Notify external systems of changes

## Integration with Other Services

### CRM Service

- Reference customers in deals and opportunities
- Sync contact information

### Billing Service

- Lookup customer for invoicing
- Get billing address

### ERP Service

- Create vendors from company data
- Manage customer master data

### Sales Module

- Reference company in offers
- Get customer credit information

