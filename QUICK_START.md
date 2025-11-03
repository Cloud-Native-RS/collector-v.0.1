# 🚀 Collector Platform - Quick Start

## Pokretanje svih servisa

```bash
./scripts/dev-start.sh
```

Ili jednostavno:

```bash
docker compose up -d
```

## 🏷️ Servisi

Svi servisi imaju prefiks `collector-` i jasne labele:

| Service | Container Name | Port | Database |
|---------|---------------|------|----------|
| Account Registry | `collector-account-registry` | 3001 | `collector_account_registry_db` |
| Orders | `collector-orders` | 3002 | `collector_orders_db` |
| Invoices | `collector-invoices` | 3003 | `collector_invoices_db` |
| Offers | `collector-offers` | 3004 | `collector_offers_db` |
| Inventory | `collector-inventory` | 3005 | `collector_inventory_db` |
| HR | `collector-hr` | 3006 | `collector_hr_db` |
| Projects | `collector-projects` | 3007 | `collector_projects_db` |
| Delivery | `collector-delivery` | 3008 | `collector_delivery_db` |

## 🗄️ Infrastruktura

| Service | Container Name | Port | Verzija |
|---------|---------------|------|---------|
| PostgreSQL | `collector-postgres` | 5432 | **17.2** |
| Redis | `collector-redis` | 6379 | **7.4.1** |
| RabbitMQ | `collector-rabbitmq` | 5672, 15672 | **3.13.4** |

## ✅ Verifikacija

```bash
# Proveri status
docker compose ps

# Proveri zdravlje servisa
curl http://localhost:3001/health
curl http://localhost:3002/health
```

## 📝 Credentials

**PostgreSQL:**
- User: `collector`
- Password: `collector_dev_pass`
- Connection: `postgresql://collector:collector_dev_pass@localhost:5432/collector_account_registry_db`

**Redis:**
- Password: `collector_redis_pass`

**RabbitMQ:**
- User: `collector`
- Password: `collector_rabbitmq_pass`
- UI: http://localhost:15672

