# Quick Start Guide

Get the Registry Service running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- Git

## Steps

### 1. Navigate to Service Directory

```bash
cd services/registry-service
```

### 2. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for local development).

### 3. Start Everything

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Redis cache
- Registry Service API

### 4. Run Database Migrations

```bash
docker-compose exec registry-service npm run db:migrate
```

### 5. Seed Sample Data (Optional)

```bash
docker-compose exec registry-service npm run db:seed
```

### 6. Test It!

**Health Check:**
```bash
curl http://localhost:3001/health
```

**API Documentation:**
Open http://localhost:3001/api-docs in your browser

**Create a Customer:**
```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default-tenant" \
  -d '{
    "type": "INDIVIDUAL",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "taxId": "12-3456789",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "United States"
    },
    "contact": {
      "email": "john@example.com"
    }
  }'
```

**List Customers:**
```bash
curl http://localhost:3001/api/customers \
  -H "x-tenant-id: default-tenant"
```

## What's Running?

| Service | URL | Description |
|---------|-----|-------------|
| Registry API | http://localhost:3001 | Main API service |
| API Docs | http://localhost:3001/api-docs | Swagger documentation |
| Health Check | http://localhost:3001/health | Health status |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |

## Next Steps

- Read the [README](README.md) for detailed documentation
- Check [API_INTEGRATION.md](API_INTEGRATION.md) for integration examples
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for architecture details
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment

## Common Issues

**Port already in use:**
```bash
# Check what's using the port
lsof -i :3001
# Kill the process or change PORT in .env
```

**Database connection failed:**
```bash
# Restart postgres container
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

**Service won't start:**
```bash
# View logs
docker-compose logs registry-service

# Rebuild
docker-compose up --build
```

## Development Mode

To run in development mode (auto-reload):

```bash
# Stop docker services
docker-compose down

# Install dependencies
npm install

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Start dev server
npm run dev
```

## Stop Services

```bash
docker-compose down
```

To remove volumes (including database data):
```bash
docker-compose down -v
```

## Need Help?

- Check the logs: `docker-compose logs -f`
- Read the documentation
- Check the [GitHub Issues](https://github.com/your-repo/issues)

