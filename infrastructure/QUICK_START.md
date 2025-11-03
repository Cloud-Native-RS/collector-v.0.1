# Quick Start - Infrastructure Setup

Brzo pokretanje infrastrukture za Collector platformu.

## Pre-requirements

- Docker & Docker Compose
- cURL (za Kong setup)

## Pokretanje

### 1. Start Infrastructure

```bash
cd infrastructure
docker-compose up -d
```

### 2. Wait for Services

Sačekajte da se svi servisi pokrenu (~30 sekundi):

```bash
docker-compose ps

# Svi servisi treba da budu "Up" i "healthy".
```

### 3. Initialize Kong Services (Optional)

Ako želite da koristite Kong API Gateway:

```bash
# Wait for Kong to be ready
sleep 10

# Initialize services
./scripts/init-kong-services.sh
```

## Testiranje

### Health Checks

```bash
# Kong
curl http://localhost:8001/health

# HAProxy
curl http://localhost:9999

# NATS
curl http://localhost:8222/healthz

# Redis
docker exec collector-redis redis-cli ping
```

### Access Points

- **API Gateway (Kong)**: http://localhost:8000
- **Kong Admin**: http://localhost:8001
- **Konga UI**: http://localhost:1337
- **HAProxy**: http://localhost:80
- **HAProxy Stats**: http://localhost:8404/stats
- **NATS Monitoring**: http://localhost:8222

## Next Steps

1. Start microservices: `cd ../services && npm run services:start`
2. Access dashboard: http://localhost:3000
3. Configure Kong routes as needed
4. Setup SSL certificates for production

