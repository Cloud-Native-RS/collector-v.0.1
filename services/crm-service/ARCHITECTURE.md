# CRM Service Architecture

## Overview

The CRM Service is a microservice responsible for managing customer relationship management functionality including leads, tasks, deals, activities, and sales pipeline analytics.

## Architecture Patterns

### Layered Architecture

The service follows a layered architecture pattern:

```
┌─────────────────────────────────┐
│      Routes (API Layer)         │
├─────────────────────────────────┤
│      Services (Business Logic)  │
├─────────────────────────────────┤
│      Database (Prisma ORM)      │
└─────────────────────────────────┘
```

### Service Layer Pattern

Business logic is encapsulated in service classes:
- `LeadService` - Lead management
- `TaskService` - Task management
- `DealService` - Deal/opportunity management
- `ActivityService` - Activity logging
- `ConversionService` - Lead to customer conversion

## Database Schema

### Core Entities

1. **Lead** - Sales leads
   - Tracks lead status (NEW, CONTACTED, QUALIFIED, etc.)
   - Source attribution (WEBSITE, SOCIAL, EMAIL, etc.)
   - Value estimation
   - Company information
   - Conversion tracking

2. **Task** - Tasks associated with leads/deals
   - Types: CALL, EMAIL, MEETING, NOTE, FOLLOW_UP
   - Priority levels: LOW, MEDIUM, HIGH, URGENT
   - Due dates and completion tracking

3. **Deal** - Sales opportunities
   - Pipeline stages: LEAD, QUALIFIED, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST
   - Value and probability tracking
   - Expected close dates

4. **Activity** - Interaction logs
   - Types: CALL, EMAIL, MEETING, NOTE
   - Associated with leads, deals, or tasks
   - Duration tracking

### Relationships

- Lead → Tasks (one-to-many)
- Lead → Deals (one-to-many)
- Lead → Activities (one-to-many)
- Deal → Tasks (one-to-many)
- Deal → Activities (one-to-many)
- Task → Activities (one-to-many)

## Multi-tenant Architecture

All data is isolated by tenant:
- Every entity includes `tenantId`
- Middleware enforces tenant isolation
- Queries automatically filter by tenant

## Integration Points

### Registry Service

The CRM service integrates with the Registry Service for lead-to-customer conversion:

1. Lead data is collected in CRM
2. When converting, data is sent to Registry Service
3. Customer is created in Registry Service
4. Lead is marked as converted with customer reference

**Integration Flow:**
```
CRM Service → Registry Client → Registry Service API
                              → Create Customer
                              → Return Customer ID
CRM Service → Update Lead (mark as converted)
```

### Event-Driven Architecture (Future)

Planned integration with RabbitMQ for event publishing:
- `lead.created` - When a new lead is created
- `lead.converted` - When a lead is converted to customer
- `deal.won` - When a deal is closed won
- `deal.lost` - When a deal is closed lost

## API Design

### RESTful Endpoints

All endpoints follow REST conventions:
- `POST /api/{resource}` - Create
- `GET /api/{resource}` - List
- `GET /api/{resource}/:id` - Get by ID
- `PUT /api/{resource}/:id` - Update
- `DELETE /api/{resource}/:id` - Delete

### Custom Actions

Some endpoints use custom actions:
- `POST /api/leads/:id/convert` - Convert lead to customer
- `PUT /api/tasks/:id/complete` - Mark task as complete
- `PUT /api/deals/:id/stage` - Update deal stage

### Query Parameters

List endpoints support filtering and pagination:
- `skip` - Number of records to skip
- `take` - Number of records to return
- Entity-specific filters (status, source, stage, etc.)
- `search` - Text search across relevant fields

## Security

### Authentication

JWT token-based authentication:
- Tokens validated via `authMiddleware`
- User ID extracted from token
- Optional: Role-based access control (future)

### Tenant Isolation

All requests must include tenant ID:
- Header: `X-Tenant-Id`
- All queries filtered by tenant
- No cross-tenant data access

## Error Handling

Centralized error handling:
- `AppError` class for known errors
- Standardized error response format
- Proper HTTP status codes
- Error logging

## Validation

Input validation using Zod:
- Request body validation
- Type-safe schemas
- Clear error messages
- Automatic type coercion

## Database Migrations

Prisma migrations:
- Version-controlled schema
- Safe migrations
- Rollback support
- Production deployments via `db:migrate:deploy`

## Deployment

### Docker

Multi-stage Docker build:
1. Build stage: Install dependencies, compile TypeScript
2. Production stage: Minimal image with only runtime dependencies

### Health Checks

Health endpoint (`/health`):
- Database connectivity check
- Service status reporting
- Used by orchestration platforms

## Monitoring & Observability

### Logging

Morgan middleware for HTTP request logging:
- Request method, URL, status, response time
- Development mode: Detailed logs
- Production mode: Error logs only

### Metrics (Future)

Planned metrics:
- Request count by endpoint
- Response time percentiles
- Error rates
- Database query performance

## Scalability Considerations

### Database

- Indexed queries for performance
- Pagination to limit result sets
- Efficient filtering and searching

### Service

- Stateless design (horizontally scalable)
- Connection pooling via Prisma
- Async/await for non-blocking operations

## Future Enhancements

1. **Event Publishing**: RabbitMQ integration for event-driven workflows
2. **Caching**: Redis caching for frequently accessed data
3. **Search**: Full-text search capabilities
4. **Notifications**: Real-time notifications for task assignments
5. **Reporting**: Advanced reporting and analytics
6. **Workflow Automation**: Automated lead scoring and routing

