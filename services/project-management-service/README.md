# Project Management Service

A microservice for managing projects, tasks, milestones, resources, and tracking progress with multi-tenant support.

## Features

- **Project Management**: Create and manage projects with status tracking
- **Milestones**: Define and track project milestones with automatic status updates
- **Task Management**: Create tasks with dependencies, priorities, and assignments
- **Resource Allocation**: Allocate employees and equipment to tasks
- **Progress Tracking**: Real-time progress reports and analytics
- **Multi-tenant**: Full tenant isolation with RBAC support
- **Event-driven**: Emits events for task completion, milestone achievements, and project status changes
- **Dependency Management**: Task dependencies with validation

## Tech Stack

- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Documentation**: Swagger/OpenAPI

## Architecture

The service follows a domain-driven design with the following modules:

- `projects`: Project CRUD and management
- `milestones`: Milestone management with auto-status updates
- `tasks`: Task management with dependency validation
- `resources`: Resource allocation and availability tracking
- `reports`: Analytics and reporting dashboards

## API Endpoints

### Projects

- `POST /api/projects` - Create a new project
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `GET /api/projects/:id/progress` - Get project progress report
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Milestones

- `POST /api/milestones` - Create a milestone
- `GET /api/milestones` - List all milestones
- `GET /api/milestones/:id` - Get milestone details
- `PUT /api/milestones/:id` - Update milestone
- `DELETE /api/milestones/:id` - Delete milestone

### Tasks

- `POST /api/tasks` - Create a task
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Resources

- `POST /api/resources` - Create a resource
- `GET /api/resources` - List all resources
- `GET /api/resources/:id` - Get resource details
- `GET /api/resources/:id/availability` - Get resource availability
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource
- `POST /api/resources/allocate` - Allocate resource to task
- `POST /api/resources/deallocate` - Deallocate resource from task

### Reports

- `GET /api/reports/projects` - Project summary report
- `GET /api/reports/tasks` - Tasks by status report
- `GET /api/reports/resources` - Resource utilization report
- `GET /api/reports/overdue-tasks` - List overdue tasks
- `GET /api/reports/delayed-milestones` - List delayed milestones
- `GET /api/reports/team-workload` - Team workload analysis

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Docker (optional)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/project_management"
PORT=3006
JWT_SECRET=your-secret-key
```

4. Generate Prisma client:
```bash
npm run db:generate
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. (Optional) Seed database with sample data:
```bash
npm run db:seed
```

7. Start the development server:
```bash
npm run dev
```

The service will be available at `http://localhost:3006`

## Docker Deployment

1. Build and start services:
```bash
docker-compose up -d
```

2. Check logs:
```bash
docker-compose logs -f project-management-service
```

## API Documentation

Once the service is running, visit:
- Swagger UI: `http://localhost:3006/api-docs`

## Business Logic

### Task Dependencies
Tasks cannot be marked as completed if their dependencies are not completed.

### Milestone Auto-Update
Milestones automatically update status when all associated tasks are completed.

### Resource Allocation
Resource allocation respects availability schedules and prevents double-booking.

### Event Emission
The service emits events for:
- `task.completed` - When a task is completed
- `milestone.achieved` - When all tasks in a milestone are complete
- `project.completed` - When a project is marked complete
- `project.status.changed` - When project status changes

## Security

- JWT-based authentication
- Multi-tenant isolation
- Role-based access control (Project Manager, Team Member, Viewer)
- Input validation using Zod schemas

## Testing

Run tests:
```bash
npm test
```

## Integration Examples

### Task Completion Flow

1. Task is completed → Emits `task.completed` event
2. Milestone status is auto-checked
3. If all tasks complete → Milestone marked as `ACHIEVED`
4. Emits `milestone.achieved` event
5. Project progress is updated

### Resource Allocation Flow

1. Create resource (employee/equipment)
2. Allocate resource to task with hours
3. Resource availability checked against schedule
4. Overlapping allocations prevented

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 3006 |
| `JWT_SECRET` | JWT signing secret | Required |
| `NODE_ENV` | Environment mode | development |

## License

MIT

