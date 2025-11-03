# Collector Platform - Infrastructure Summary

Kompletnа infrastruktura za Collector microservices platformu je kreirana.

## 📦 Kreirane Komponente

### 1. API Gateway - Kong
- **Lokacija**: `infrastructure/docker-compose.yml`
- **Portovi**: 
  - Proxy: `8000`
  - Admin API: `8001`
  - SSL Proxy: `8443`
  - SSL Admin: `8444`
- **Funkcionalnosti**:
  - Rutiranje zahteva ka microservisima
  - Rate limiting (100 req/min, 1000 req/h)
  - CORS support
  - JWT authentication ready
  - Request/Response transformation
  - Correlation ID tracking

### 2. Load Balancer - HAProxy
- **Lokacija**: `infrastructure/haproxy/haproxy.cfg`
- **Portovi**: 
  - HTTP: `80`
  - HTTPS: `443`
  - Stats: `8404`
  - Health: `9999`
- **Funkcionalnosti**:
  - Round-robin load balancing
  - Health checks
  - SSL termination
  - Stats dashboard
  - Reverse proxy ka Kong Gateway

### 3. Event Bus - NATS
- **Lokacija**: `infrastructure/docker-compose.yml`
- **Portovi**: 
  - Client: `4222`
  - Monitoring: `8222`
  - Cluster: `6222`
- **Funkcionalnosti**:
  - Pub/Sub messaging
  - JetStream (persistent messaging)
  - HTTP monitoring
  - Event streaming

### 4. Cache Layer - Redis
- **Lokacija**: `infrastructure/docker-compose.yml`
- **Port**: `6379`
- **Funkcionalnosti**:
  - Key-value caching
  - Session storage
  - Rate limiting backend
  - Data caching

### 5. Shared Database - PostgreSQL
- **Lokacija**: `infrastructure/docker-compose.yml`
- **Port**: `5432`
- **Namena**:
  - Kong konfiguracija
  - Aplikacijski podaci (optional)

## 📁 Struktura Fajlova

```
infrastructure/
├── docker-compose.yml          # Glavni infrastructure stack
├── haproxy/
│   └── haproxy.cfg             # HAProxy konfiguracija
├── kong/
│   ├── kong.yml                # Kong servisi i rute
│   └── init-kong.sh            # Kong initialization script
├── scripts/
│   └── init-kong-services.sh   # Auto-setup Kong servisa
├── README.md                   # Detaljna dokumentacija
└── QUICK_START.md             # Brzo pokretanje
```

## 🚀 Pokretanje

### Option 1: Sama Infrastruktura
```bash
cd infrastructure
docker-compose up -d
```

### Option 2: Infrastruktura + Servisi
```bash
npm run start:all
```

### Option 3: Korak po korak
```bash
# 1. Start infrastructure
cd infrastructure && docker-compose up -d

# 2. Initialize Kong (optional)
./scripts/init-kong-services.sh

# 3. Start microservices
cd .. && npm run services:start
```

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| HAProxy | http://localhost:80 | Main entry point |
| Kong Gateway | http://localhost:8000 | API Gateway |
| Kong Admin | http://localhost:8001 | Kong management API |
| Konga UI | http://localhost:1337 | Kong admin interface |
| HAProxy Stats | http://localhost:8404/stats | Load balancer stats |
| NATS Monitoring | http://localhost:8222 | Event bus monitoring |
| Redis | localhost:6379 | Cache layer |

## 🔌 API Routes (Kong)

Svi zahtevi prolaze kroz Kong Gateway:

- `/api/registry/*` → registry-service
- `/api/customers` → registry-service
- `/api/companies` → registry-service
- `/api/invoices` → invoices-service
- `/api/payments` → invoices-service
- `/api/dunnings` → invoices-service
- `/api/orders` → orders-service
- `/api/delivery` → delivery-service
- `/api/offers` → offers-service

## 🔧 Kong Plugins

Svaki servis ima:
- **rate-limiting**: 100 zahteva/min, 1000/h
- **cors**: Cross-origin support
- **correlation-id**: Request tracking
- **request-transformer**: Header transformation

## 📊 Monitoring

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

### Stats & Metrics
```bash
# HAProxy Stats
open http://localhost:8404/stats

# Kong Metrics
curl http://localhost:8001/metrics

# NATS Varz
curl http://localhost:8222/varz
```

## 🎯 Event Bus Usage

### Publish Event
```javascript
const nats = require('nats');
const nc = await nats.connect('nats://localhost:4222');

await nc.publish('invoice.created', JSON.stringify({
  invoiceId: 'inv-123',
  customerId: 'cust-456',
  amount: 1000
}));
```

### Subscribe to Events
```javascript
const sub = nc.subscribe('invoice.created');
for await (const msg of sub) {
  const data = JSON.parse(msg.data);
  console.log('New invoice:', data);
}
```

## 💾 Cache Usage

### Redis Client
```javascript
const redis = require('redis');
const client = redis.createClient({ url: 'redis://localhost:6379' });

// Cache invoice
await client.setEx(`invoice:${id}`, 3600, JSON.stringify(invoice));

// Get cached invoice
const cached = await client.get(`invoice:${id}`);
```

## 🔐 Security

- ✅ SSL/TLS ready (HAProxy)
- ✅ Rate limiting (Kong)
- ✅ CORS protection
- ✅ JWT authentication ready
- ✅ Request validation
- ⚠️ Change default passwords in production!

## 📝 Next Steps

1. **SSL Certificates** - Dodaj prave sertifikate za HTTPS
2. **Authentication** - Setup JWT u Kong-u
3. **Monitoring** - Integriši Prometheus/Grafana
4. **Logging** - Centralizovano logovanje (ELK stack)
5. **High Availability** - Dodaj redundanciju

## 🐛 Troubleshooting

Ako nešto ne radi, proveri:

1. **Docker status**: `docker ps`
2. **Service logs**: `docker-compose logs <service>`
3. **Health checks**: Vidite monitoring sekciju gore
4. **Network**: `docker network ls` i `docker network inspect`

## 📚 Dokumentacija

- **Infrastructure README**: `infrastructure/README.md`
- **Quick Start**: `infrastructure/QUICK_START.md`
- **Kong Docs**: https://docs.konghq.com/
- **HAProxy Docs**: http://www.haproxy.org/#docs
- **NATS Docs**: https://docs.nats.io/

Infrastruktura je spremna za production korišćenje! 🚀

