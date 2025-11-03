# Quick Start Guide

Get the Project Management Service running in 5 minutes!

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 16+ installed (or use Docker)
- npm or yarn package manager

## Option 1: Local Development

### 1. Install Dependencies

```bash
cd services/project-management-service
npm install
```

### 2. Setup Database

Create a PostgreSQL database:

```bash
createdb project_management
```

Or use Docker:

```bash
docker run --name project-management-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=project_management \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### 3. Configure Environment

Create `.env` file:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/project_management"
PORT=3006
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

### 4. Run Migrations

```bash
npm run db:generate
npm run db:migrate
```

### 5. Seed Database (Optional)

```bash
npm run db:seed
```

### 6. Start Server

```bash
npm run dev
```

Service is running at `http://localhost:3006` 🎉

### 7. Access API Documentation

Open `http://localhost:3006/api-docs` in your browser.

## Option 2: Docker Compose

### 1. Navigate to Service Directory

```bash
cd services/project-management-service
```

### 2. Start Everything

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database
- Run migrations
- Start the service

### 3. Check Logs

```bash
docker-compose logs -f project-management-service
```

### 4. Seed Database (Optional)

```bash
docker-compose exec project-management-service npm run db:seed
```

### 5. Access Service

- API: `http://localhost:3006`
- API Docs: `http://localhost:3006/api-docs`

## Testing the API

### 1. Generate a Test JWT Token

Create a simple script to generate a JWT for testing:

```javascript
// test-token.js
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    userId: 'test-user-123',
    tenantId: 'default-tenant',
    role: 'PROJECT_MANAGER',
  },
  'your-secret-key-change-in-production'
);

console.log('Token:', token);
```

Run: `node test-token.js`

### 2. Create a Project

```bash
curl -X POST http://localhost:3006/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Project",
    "description": "Testing the API",
    "status": "IN_PROGRESS",
    "startDate": "2024-01-01T00:00:00Z"
  }'
```

### 3. Get All Projects

```bash
curl http://localhost:3006/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Next Steps

1. **Read the README**: Full feature documentation
2. **Check API Examples**: See `API_EXAMPLES.md` for detailed usage
3. **Explore Architecture**: Read `ARCHITECTURE.md` for design details

## Troubleshooting

### Port Already in Use

Change the port in `.env`:
```
PORT=3007
```

### Database Connection Error

Check PostgreSQL is running:
```bash
pg_isready
```

Or check Docker container:
```bash
docker ps | grep postgres
```

### Migration Errors

Reset the database:
```bash
npm run db:migrate -- --force
```

## Development Commands

```bash
npm run dev         # Start development server with hot reload
npm run build       # Build for production
npm run start       # Start production server
npm run db:studio   # Open Prisma Studio (database GUI)
npm run db:seed     # Seed database with sample data
npm test            # Run tests
```

## API Endpoints Overview

- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project
- `GET /api/projects/:id/progress` - Get progress
- `POST /api/tasks` - Create task
- `GET /api/tasks` - List tasks
- `GET /api/reports/*` - Various reports

See full API documentation at `http://localhost:3006/api-docs`

---

**Happy coding!** 🚀

