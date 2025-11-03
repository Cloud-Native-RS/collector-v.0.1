# CRM Service

CRM (Customer Relationship Management) microservice for managing leads, tasks, deals, activities, and sales pipeline.

## Features

- **Lead Management**: Track and manage sales leads with status tracking and source attribution
- **Task Management**: Create and manage tasks associated with leads or deals
- **Deal/Opportunity Management**: Manage sales opportunities through pipeline stages
- **Activity Logging**: Track all interactions (calls, emails, meetings, notes)
- **Sales Pipeline Analytics**: Real-time pipeline statistics and conversion metrics
- **Lead to Customer Conversion**: Integrate with Registry Service to convert leads to customers

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Documentation**: Swagger/OpenAPI

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up database:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed  # Optional: seed with sample data
```

4. Start development server:
```bash
npm run dev
```

The service will be available at `http://localhost:3009`
API documentation will be available at `http://localhost:3009/api-docs`

## Environment Variables

```env
PORT=3009
DATABASE_URL=postgresql://user:password@localhost:5432/crm_db
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
REGISTRY_SERVICE_URL=http://localhost:3001
NODE_ENV=development
```

## API Endpoints

### Leads
- `POST /api/leads` - Create a new lead
- `GET /api/leads` - List all leads (with filters)
- `GET /api/leads/:id` - Get lead by ID
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/:id/convert` - Convert lead to customer

### Tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks` - List all tasks (with filters)
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/:id/complete` - Mark task as complete

### Deals
- `POST /api/deals` - Create a new deal
- `GET /api/deals` - List all deals (with filters)
- `GET /api/deals/:id` - Get deal by ID
- `PUT /api/deals/:id` - Update deal
- `DELETE /api/deals/:id` - Delete deal
- `PUT /api/deals/:id/stage` - Update deal stage

### Activities
- `POST /api/activities` - Create a new activity
- `GET /api/activities` - List all activities (with filters)
- `GET /api/activities/:id` - Get activity by ID
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

### Analytics
- `GET /api/analytics/pipeline` - Get sales pipeline statistics
- `GET /api/analytics/leads-by-source` - Get leads grouped by source
- `GET /api/analytics/conversion-rate` - Get lead conversion metrics
- `GET /api/analytics/deals-by-stage` - Get deals grouped by stage

## Database Schema

The service uses the following main entities:
- **Lead**: Sales leads with status, source, and value tracking
- **Task**: Tasks associated with leads or deals
- **Deal**: Sales opportunities in pipeline stages
- **Activity**: Logged interactions and communications

See `prisma/schema.prisma` for full schema definition.

## Docker

### Using Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- CRM Service

### Using Docker

```bash
docker build -t crm-service .
docker run -p 3009:3009 --env-file .env crm-service
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio
- `npm test` - Run tests
- `npm run lint` - Lint code

## Multi-tenant Support

All endpoints support multi-tenant isolation. Include the tenant ID in the request header:
```
X-Tenant-Id: your-tenant-id
```

## Authentication

Endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Integration with Registry Service

The CRM service integrates with the Registry Service to convert leads to customers. When converting a lead:
1. Lead data is mapped to customer format
2. Customer is created in Registry Service
3. Lead is marked as converted with customer reference

Set `REGISTRY_SERVICE_URL` environment variable to point to your Registry Service instance.

## Health Check

Check service health:
```bash
curl http://localhost:3009/health
```

## API Documentation

Swagger UI is available at `/api-docs` when the service is running.

## License

Part of the Collector Platform.

