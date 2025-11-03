# 🐳 Collector Platform - Docker Setup

## Quick Start

Pokreni sve mikroservise jednom komandom:

```bash
./scripts/dev-start.sh
```

Ili ručno:

```bash
docker compose up -d
```

## 📋 Servisi

### Mikroservisi
- **collector-account-registry** (port 3001) - Account Registry (Customer & Company Management)
- **collector-orders** (port 3002) - Order Processing
- **collector-invoices** (port 3003) - Invoice Management
- **collector-offers** (port 3004) - Offer Management
- **collector-inventory** (port 3005) - Product & Stock Management
- **collector-hr** (port 3006) - HR Management
- **collector-projects** (port 3007) - Project Management
- **collector-delivery** (port 3008) - Delivery Management

### Infrastruktura
- **PostgreSQL 17.2** (port 5432) - Database
- **Redis 7.4.1** (port 6379) - Cache
- **RabbitMQ 3.13.4** (ports 5672, 15672) - Message Broker

## 🏷️ Labeling

Svi kontejneri imaju jasne labele:
- `app=collector` - Identifikuje sve Collector servise
- `service=<service-name>` - Ime specifičnog servisa
- `version=<version>` - Verzija servisa

## 🔍 Useful Commands

```bash
# View logs
docker compose logs -f collector-account-registry

# Check status
docker compose ps

# Stop all
docker compose down

# Restart a service
docker compose restart collector-account-registry

# View service health
curl http://localhost:3001/health
```

## 🔧 Setup Databases

Automatski se kreiraju sve potrebne baze pri pokretanju, ali možeš ručno:

```bash
./scripts/setup-databases.sh
```

## 📊 Service URLs

- Frontend: http://localhost:3000
- Registry API: http://localhost:3001/api-docs
- RabbitMQ UI: http://localhost:15672 (user: collector, pass: collector_rabbitmq_pass)

## 🔐 Default Credentials

**PostgreSQL:**
- User: `collector`
- Password: `collector_dev_pass`
- Host: `localhost:5432`

**Redis:**
- Password: `collector_redis_pass`

**RabbitMQ:**
- User: `collector`
- Password: `collector_rabbitmq_pass`

⚠️ **WARNING**: Ovo su development credentials. Promeni u production!

