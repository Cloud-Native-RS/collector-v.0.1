# Inventory Service - Deployment Guide

Complete guide for deploying the Inventory & Product Management Service to production.

## Prerequisites

- Node.js 20+ or Docker
- PostgreSQL 16+
- Redis (optional, for caching)
- Kubernetes cluster (for K8s deployment)
- AWS/GCP/Azure account (for cloud deployment)

## Local Development Deployment

### Using Docker Compose

1. **Start services:**
```bash
cd services/inventory-service
docker-compose up -d
```

2. **Verify deployment:**
```bash
curl http://localhost:3002/health
```

3. **View logs:**
```bash
docker-compose logs -f inventory-service
```

### Manual Deployment

1. **Install dependencies:**
```bash
npm install
```

2. **Set up database:**
```bash
# Configure environment variables
cp .env.example .env

# Run migrations
npm run db:migrate

# Seed data (optional)
npm run db:seed
```

3. **Start server:**
```bash
npm start
```

## Production Deployment

### Environment Variables

Create `.env` file:

```env
# Server
NODE_ENV=production
PORT=3002

# Database
DATABASE_URL=postgresql://user:password@host:5432/inventory_db

# Security
JWT_SECRET=your-secure-secret-key-minimum-32-characters

# Redis (optional)
REDIS_URL=redis://host:6379

# CORS
CORS_ORIGIN=https://your-domain.com
```

### Docker Deployment

#### 1. Build Docker Image

```bash
docker build -t inventory-service:latest .
```

#### 2. Run Container

```bash
docker run -d \
  --name inventory-service \
  -p 3002:3002 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e JWT_SECRET=your-secret \
  inventory-service:latest
```

#### 3. Docker Compose for Production

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - inventory-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - inventory-network

  inventory-service:
    build: .
    ports:
      - "3002:3002"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - inventory-network
    restart: unless-stopped

networks:
  inventory-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment

#### 1. Create ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: inventory-config
data:
  DATABASE_URL: "postgresql://user:pass@postgres-service:5432/inventory_db"
  PORT: "3002"
  NODE_ENV: "production"
```

#### 2. Create Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: inventory-secrets
type: Opaque
data:
  JWT_SECRET: <base64-encoded-secret>
```

#### 3. Create Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: inventory-service
  template:
    metadata:
      labels:
        app: inventory-service
    spec:
      containers:
      - name: inventory-service
        image: your-registry/inventory-service:latest
        ports:
        - containerPort: 3002
        envFrom:
        - configMapRef:
            name: inventory-config
        - secretRef:
            name: inventory-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### 4. Create Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: inventory-service
spec:
  selector:
    app: inventory-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3002
  type: LoadBalancer
```

#### 5. Deploy

```bash
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

### AWS Deployment

#### ECS (Elastic Container Service)

1. **Push image to ECR:**
```bash
aws ecr create-repository --repository-name inventory-service
docker tag inventory-service:latest <account-id>.dkr.ecr.<region>.amazonaws.com/inventory-service:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/inventory-service:latest
```

2. **Create ECS Task Definition**

3. **Create ECS Service**

4. **Configure ALB (Application Load Balancer)**

#### EKS (Elastic Kubernetes Service)

Follow Kubernetes deployment above on EKS cluster.

### Google Cloud Deployment

#### Cloud Run

1. **Build and push:**
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/inventory-service
```

2. **Deploy:**
```bash
gcloud run deploy inventory-service \
  --image gcr.io/PROJECT_ID/inventory-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### GKE (Google Kubernetes Engine)

Follow Kubernetes deployment on GKE cluster.

### Azure Deployment

#### Container Apps

1. **Push to ACR:**
```bash
az acr build --registry <registry-name> --image inventory-service:latest .
```

2. **Create Container App**

3. **Configure networking**

#### AKS (Azure Kubernetes Service)

Follow Kubernetes deployment on AKS cluster.

## Database Setup

### Initial Setup

1. **Create database:**
```sql
CREATE DATABASE inventory_db;
CREATE USER inventory_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;
```

2. **Run migrations:**
```bash
npm run db:migrate:deploy
```

### Backup Strategy

#### Automated Backups

1. **Daily backups:**
```bash
0 2 * * * pg_dump -h localhost -U inventory_user inventory_db > backup_$(date +\%Y\%m\%d).sql
```

2. **Retention:**
- Keep 7 daily backups
- Keep 4 weekly backups
- Keep 12 monthly backups

#### Restore

```bash
psql -h localhost -U inventory_user inventory_db < backup_20241201.sql
```

## Monitoring

### Health Checks

Monitor the `/health` endpoint:
```bash
curl http://your-service/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "inventory-service",
  "timestamp": "2024-12-01T00:00:00.000Z"
}
```

### Application Logs

#### Docker
```bash
docker logs -f inventory-service
```

#### Kubernetes
```bash
kubectl logs -f deployment/inventory-service
```

### Database Monitoring

Monitor PostgreSQL:
- Connection count
- Query performance
- Disk usage
- Replication lag

### Alerts

Configure alerts for:
- Service unavailable
- High error rate
- Database connectivity issues
- Low stock levels
- Slow query performance

## Security

### Production Checklist

- [ ] Change JWT_SECRET
- [ ] Use strong database passwords
- [ ] Enable SSL/TLS for database
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up WAF (Web Application Firewall)
- [ ] Configure CORS properly
- [ ] Enable audit logging
- [ ] Regular security updates

### SSL/TLS

Use reverse proxy (Nginx/Traefik) or application load balancer with SSL certificates.

### Secrets Management

Use secret management tools:
- AWS Secrets Manager
- Google Secret Manager
- Azure Key Vault
- HashiCorp Vault

## Scaling

### Horizontal Scaling

- Deploy multiple instances
- Use load balancer
- Shared PostgreSQL database
- Optional: Redis for caching

### Vertical Scaling

- Increase container resources
- Optimize database queries
- Add database replicas
- Implement caching

## Troubleshooting

### Service Won't Start

1. Check environment variables
2. Verify database connectivity
3. Check port availability
4. Review application logs

### Database Connection Issues

1. Verify DATABASE_URL
2. Check firewall rules
3. Confirm database is running
4. Test connection from container

### Performance Issues

1. Review slow queries
2. Check database indexes
3. Monitor resource usage
4. Optimize queries

### High Memory Usage

1. Check for memory leaks
2. Increase container memory
3. Enable garbage collection logging
4. Review cache implementation

## Rollback Procedure

### Docker

```bash
docker stop inventory-service
docker rm inventory-service
docker run -d --name inventory-service <previous-image>:tag
```

### Kubernetes

```bash
kubectl rollout undo deployment/inventory-service
```

### Database Rollback

```bash
npm run migrate:rollback
```

## Maintenance

### Updates

1. Backup database
2. Deploy new version
3. Run migrations
4. Verify health
5. Monitor logs

### Zero-Downtime Deployment

1. Deploy new instances
2. Health checks pass
3. Switch traffic to new instances
4. Monitor
5. Remove old instances

## Support

For deployment issues:
1. Check logs
2. Review architecture guide
3. Contact platform team

