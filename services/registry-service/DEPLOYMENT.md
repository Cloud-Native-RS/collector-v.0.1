# Deployment Guide

## Overview

This guide covers deploying the Registry Service to various environments.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development)
- PostgreSQL 16+ (or managed database)
- Redis (optional, for caching)

## Quick Start with Docker

### 1. Clone and Setup

```bash
cd services/registry-service
cp .env.example .env
# Edit .env with your settings
```

### 2. Start Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Registry Service on port 3001

### 3. Run Migrations

```bash
docker-compose exec registry-service npm run db:migrate
```

### 4. Seed Database (Optional)

```bash
docker-compose exec registry-service npm run db:seed
```

### 5. Verify

```bash
curl http://localhost:3001/health
# Should return: {"status":"healthy","service":"registry-service",...}

curl http://localhost:3001/api-docs
# Should open Swagger UI
```

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your local settings
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The service will be available at http://localhost:3001

## Production Deployment

### Option 1: Docker on Server

#### 1. Build Image

```bash
docker build -t registry-service:latest .
```

#### 2. Push to Registry (Optional)

```bash
docker tag registry-service:latest your-registry.com/registry-service:latest
docker push your-registry.com/registry-service:latest
```

#### 3. Deploy with Docker Compose

Update `docker-compose.yml` with production settings:

```yaml
services:
  registry-service:
    image: registry-service:latest
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      # ... other env vars
    restart: always
```

#### 4. Run

```bash
docker-compose up -d
```

### Option 2: Kubernetes

#### 1. Create ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: registry-service-config
data:
  PORT: "3001"
  NODE_ENV: "production"
  DATABASE_URL: "postgresql://..."
  JWT_SECRET: "..."
```

#### 2. Create Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: registry-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: registry-service
  template:
    metadata:
      labels:
        app: registry-service
    spec:
      containers:
      - name: registry-service
        image: registry-service:latest
        ports:
        - containerPort: 3001
        envFrom:
        - configMapRef:
            name: registry-service-config
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
```

#### 3. Create Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: registry-service
spec:
  selector:
    app: registry-service
  ports:
  - port: 80
    targetPort: 3001
  type: LoadBalancer
```

### Option 3: Cloud Platforms

#### AWS (ECS/EKS)

**ECS Deployment**:
1. Create ECR repository
2. Push Docker image to ECR
3. Create ECS task definition
4. Deploy to ECS cluster
5. Configure ALB for load balancing

**EKS Deployment**:
1. Follow Kubernetes deployment above
2. Use AWS RDS for PostgreSQL
3. Use ElastiCache for Redis

#### Google Cloud (Cloud Run)

**Deploy to Cloud Run**:

```bash
gcloud builds submit --tag gcr.io/PROJECT-ID/registry-service
gcloud run deploy registry-service \
  --image gcr.io/PROJECT-ID/registry-service \
  --platform managed \
  --region us-central1
```

#### Azure (Container Apps)

**Deploy to Azure Container Apps**:

```bash
az containerapp create \
  --name registry-service \
  --image your-registry.azurecr.io/registry-service:latest \
  --resource-group myResourceGroup \
  --environment myContainerAppEnv
```

## Environment Variables

### Required

```bash
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=your-secret-key
PORT=3001
NODE_ENV=production
```

### Optional

```bash
REDIS_URL=redis://host:6379
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
BCRYPT_SALT_ROUNDS=10
```

## Database Setup

### PostgreSQL

**Required Version**: 16+

**Create Database**:

```sql
CREATE DATABASE registry_db;
CREATE USER registry_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE registry_db TO registry_user;
```

**Run Migrations**:

```bash
npx prisma migrate deploy
```

### Production Database Considerations

1. **Connection Pooling**: Use PgBouncer or Prisma connection pooling
2. **Read Replicas**: Set up read replicas for scaling
3. **Backups**: Configure automated backups
4. **Monitoring**: Set up database monitoring and alerts

## Security Hardening

### 1. Environment Variables

- Never commit `.env` files
- Use secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)
- Rotate secrets regularly

### 2. SSL/TLS

- Use HTTPS in production
- Configure SSL termination at load balancer
- Enable HTTPS redirects

### 3. CORS

```typescript
cors({
  origin: process.env.CORS_ORIGIN, // Whitelist specific origins
  credentials: true
});
```

### 4. Rate Limiting

Implement rate limiting (future):

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 5. API Keys

Generate API keys for external integrations:

```bash
npm run generate-api-key
```

## Monitoring & Logging

### Application Logs

```bash
# View logs
docker-compose logs -f registry-service

# In Kubernetes
kubectl logs -f deployment/registry-service
```

### Health Checks

Monitor the `/health` endpoint:

```bash
# Setup monitoring
curl http://your-api.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "registry-service",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Database Monitoring

- Monitor connection pool usage
- Track slow queries
- Monitor database size and growth

### Application Performance Monitoring (APM)

Consider integrating:
- New Relic
- Datadog
- App Insights
- Prometheus + Grafana

## Scaling

### Horizontal Scaling

Run multiple instances behind a load balancer:

```bash
# Docker Compose
docker-compose scale registry-service=3

# Kubernetes
kubectl scale deployment registry-service --replicas=5
```

### Database Scaling

1. Add read replicas for read-heavy workloads
2. Use connection pooling (PgBouncer)
3. Optimize queries with indexes

### Caching

Enable Redis caching (future enhancement):

```typescript
// Cache frequently accessed data
const customer = await redis.get(`customer:${id}`);
if (!customer) {
  customer = await db.customer.findUnique({ where: { id } });
  await redis.setex(`customer:${id}`, 3600, JSON.stringify(customer));
}
```

## Backup & Recovery

### Database Backups

**Automated Backups**:

```bash
# Daily backup script
pg_dump -h host -U user registry_db > backup_$(date +%Y%m%d).sql
```

**Using pgBackRest (recommended for production)**:

```bash
pgbackrest backup --stanza=registry_db
```

### Application Data

- Database backups are sufficient
- No file storage required

### Disaster Recovery

**RTO (Recovery Time Objective)**: < 1 hour  
**RPO (Recovery Point Objective)**: < 15 minutes

## Troubleshooting

### Service Won't Start

1. Check logs: `docker-compose logs registry-service`
2. Verify environment variables
3. Check database connectivity
4. Verify port availability

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Check firewall rules
3. Verify database is running
4. Check database credentials

### Performance Issues

1. Check database query performance
2. Monitor connection pool usage
3. Review indexes
4. Check for N+1 queries

## Support

For deployment issues:
- Check logs first
- Review environment configuration
- Contact infrastructure team
- Escalate to development team

