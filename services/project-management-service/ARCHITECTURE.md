# Architecture Documentation

## Overview

The Project Management Service is designed as a domain-driven microservice with clear separation of concerns, multi-tenant support, and event-driven architecture.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Express Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Projects  │  │ Milestones │  │   Tasks    │            │
│  │   Module   │  │   Module   │  │   Module   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Resources  │  │   Reports  │  │   Events   │            │
│  │   Module   │  │   Module   │  │   Emitter  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│              Middleware Layer                                │
│  - Authentication (JWT)                                      │
│  - Authorization (RBAC)                                      │
│  - Tenant Isolation                                          │
│  - Error Handling                                            │
├─────────────────────────────────────────────────────────────┤
│                  Prisma ORM                                  │
│                     ↓                                        │
│              PostgreSQL Database                             │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

Each domain module follows a consistent structure:

```
modules/
  ├── projects/
  │   ├── project.service.ts    # Business logic
  │   ├── project.controller.ts # Request handling
  │   └── project.routes.ts     # Route definitions
  ├── milestones/
  │   ├── milestone.service.ts
  │   ├── milestone.controller.ts
  │   └── milestone.routes.ts
  └── ...
```

## Data Model

### Core Entities

**Project**
- Root entity for organizing work
- Tracks overall status and timeline
- Links to CRM clients for billing

**Milestone**
- Groups related tasks
- Auto-updates status when all tasks complete
- Supports project phases

**Task**
- Granular work items
- Supports dependencies (blocking tasks)
- Tracks estimated vs actual hours
- Assignable to team members

**Resource**
- Represents employees or equipment
- Tracks availability schedules
- Can be allocated to multiple tasks

**TaskDependency**
- Many-to-many relationship
- Enforces completion order
- Business rule: dependencies must complete before dependent task

**TaskResource**
- Allocation of resources to tasks
- Tracks allocated hours
- Supports availability checks

### Entity Relationships

```
Project (1) ──→ (N) Milestone
Project (1) ──→ (N) Task
Milestone (1) ──→ (N) Task
Task (N) ──→ (N) TaskDependency
Task (N) ──→ (N) TaskResource
Resource (N) ──→ (N) TaskResource
```

## Business Rules

### 1. Task Completion Validation

```typescript
// Task cannot be completed if dependencies are incomplete
validateTaskCompletion(taskId) {
  const task = await getTaskWithDependencies(taskId);
  const incompleteDeps = task.dependencies.filter(
    dep => dep.status !== 'COMPLETED'
  );
  if (incompleteDeps.length > 0) {
    throw Error('Dependencies must be completed first');
  }
}
```

### 2. Milestone Auto-Status

```typescript
// Milestone automatically updates when all tasks complete
updateMilestoneStatusAuto(milestoneId) {
  const milestone = await getMilestoneWithTasks(milestoneId);
  const allCompleted = milestone.tasks.every(t => t.status === 'COMPLETED');
  
  if (allCompleted) {
    await markMilestoneAsAchieved(milestoneId);
    emit('milestone.achieved', { milestoneId });
  }
}
```

### 3. Resource Allocation

```typescript
// Resource cannot be double-allocated to same task
allocateResource(taskId, resourceId) {
  const existing = await findExistingAllocation(taskId, resourceId);
  if (existing) {
    throw Error('Resource already allocated');
  }
  return createAllocation(taskId, resourceId);
}
```

## Multi-Tenant Architecture

### Tenant Isolation

All queries are scoped by `tenantId`:

```typescript
const projects = await prisma.project.findMany({
  where: { tenantId: req.user.tenantId }
});
```

### Authentication Flow

1. Client sends JWT token in `Authorization` header
2. `authenticate` middleware validates token
3. `tenantMiddleware` extracts and validates tenant
4. Request proceeds with `req.user` populated

### Role-Based Access

```typescript
enum UserRole {
  PROJECT_MANAGER,  // Full CRUD access
  TEAM_MEMBER,      // Can update assigned tasks
  VIEWER            // Read-only access
}
```

## Event-Driven Architecture

### Event Types

| Event | Trigger | Payload |
|-------|---------|---------|
| `task.completed` | Task status → COMPLETED | taskId, projectId, assignedTo, completedAt |
| `milestone.achieved` | All tasks in milestone complete | milestoneId, projectId, achievedAt |
| `project.completed` | Project status → COMPLETED | projectId, tenantId |
| `project.status.changed` | Project status updated | projectId, oldStatus, newStatus |

### Event Consumers

Events can be consumed by:
- **Notifications Service**: Alert users of task completions
- **Billing Service**: Track billable hours and milestones
- **Analytics Service**: Update dashboards and reports
- **HR Service**: Track resource utilization

## API Design

### RESTful Endpoints

Follow REST conventions:
- `GET /api/projects` - List
- `POST /api/projects` - Create
- `GET /api/projects/:id` - Get one
- `PUT /api/projects/:id` - Update
- `DELETE /api/projects/:id` - Delete

### Specialized Endpoints

Non-CRUD operations:
- `GET /api/projects/:id/progress` - Calculated report
- `POST /api/resources/allocate` - Business action
- `GET /api/reports/*` - Analytics

### Error Handling

Standardized error responses:

```json
{
  "error": "Human-readable error message"
}
```

HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No content (deleted)
- `400` - Bad request (validation)
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Internal server error

## Security

### Authentication

JWT-based authentication with:
- User ID
- Tenant ID
- Role

### Authorization

Role-based access control:
- Project Managers: Full CRUD
- Team Members: Update own tasks, read projects
- Viewers: Read-only access

### Data Isolation

All database queries filtered by `tenantId` to prevent data leakage.

## Performance Considerations

### Database Indexing

Critical indexes:
- `tenantId` on all tables
- `status` for filtering
- `assignedTo` for user tasks
- `projectId` for project queries

### Query Optimization

- Use `include` for related data
- Limit result sets with pagination
- Cache frequently accessed data

### Scalability

- Stateless service (JWT auth)
- Horizontal scaling possible
- Database connection pooling
- Event-driven decoupling

## Testing Strategy

### Unit Tests

Test business logic in isolation:
- Task dependency validation
- Milestone auto-status updates
- Resource allocation rules

### Integration Tests

Test API endpoints with test database:
- CRUD operations
- Error handling
- Multi-tenant isolation

### E2E Tests

Test complete workflows:
- Create project → Add milestones → Create tasks → Complete tasks → Achieve milestone

## Deployment

### Docker

Multi-stage build:
1. Install dependencies
2. Generate Prisma client
3. Build TypeScript
4. Production image with minimal dependencies

### Environment Variables

Required configuration:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Token signing key
- `PORT` - Server port
- `NODE_ENV` - Environment mode

### Health Checks

- `/health` endpoint
- Database connectivity check
- Ready for load balancer health probes

## Future Enhancements

- [ ] GraphQL API for complex queries
- [ ] Real-time updates via WebSockets
- [ ] Advanced reporting with data aggregation
- [ ] File attachments for tasks
- [ ] Time tracking integration
- [ ] Kanban board view support
- [ ] Gantt chart generation
- [ ] Email notifications
- [ ] Mobile app API optimization

