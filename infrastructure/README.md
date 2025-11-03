# Collector Platform Infrastructure

Kompletnа infrastruktura za Collector microservices platformu sa API Gateway-om, Load Balancer-om, Event Bus-om i Cache Layer-om.

## Arhitektura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │   Load Balancer │    │   Event Bus     │    │   Cache Layer   │
│   (Kong)        │    │   (HAProxy)     │    │   (NATS)        │    │   (Redis)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         └───────────────────────┼───────────────────────┼───────────────────────┘
                                 │                       │
                    ┌─────────────┼───────────────────────┼─────────────┐
                    │             │                       │             │
           ┌────────▼─────┐ ┌─────▼─────┐ ┌─────────────▼─┐ ┌──────────▼─────┐
           │   Offers     │ │  Orders   │ │ Delivery Notes│ │   Invoices     │
           │   Service    │ │ Service   │ │   Service     │ │   Service      │
           └─────────────┘ └───────────┘ └───────────────┘ └────────────────┘
                    │             │                       │             │
                    └─────────────┼───────────────────────┼─────────────┘
                                  │                       │
                        ┌─────────▼─────────┐    ┌────────▼─────────┐    ┌────────▼─────────┐
                        │   PostgreSQL      │    │   Redis Cache    │    │   RabbitMQ       │
                        │   (Primary DB)    │    │                  │    │   (Event Bus)    │
                        └───────────────────┘    └──────────────────┘    └──────────────────┘
```

## Komponente

### 1. Kong API Gateway (Port 8000, Admin: 8001)
- **Rutiranje** zahteva ka microservisima
- **Rate Limiting** - kontrola brzine zahteva
- **CORS** - Cross-Origin Resource Sharing
- **JWT Authentication** - autentifikacija
- **Request/Response Transformation**
- **Correlation ID** - praćenje zahteva
- **Monitoring** i logging

### 2. HAProxy Load Balancer (Port 80/443)
- **Load Balancing** - raspodela opterećenja
- **Health Checks** - provera zdravlja servisa
- **SSL Termination** - HTTPS rukovanje
- **Stats Interface** - monitoring (port 8404)
- **Reverse Proxy** ka Kong Gateway-u

### 3. RabbitMQ Message Broker (Port 5672, Management: 15672)
- **AMQP** messaging protokol
- **Message Queues** - durable queues sa persistence
- **Exchanges** - topic, direct, fanout routing
- **Event Streaming** između servisa
- **Management UI** - web-based administration
- **High Availability** - clustering support
- **Dead Letter Queues** - failed message handling

### 3b. NATS Event Bus (Port 4222) - Optional Alternative
- **Pub/Sub** messaging
- **JetStream** - persistent messaging
- **Event streaming** između servisa
- **HTTP Monitoring** (port 8222)
- *Note: RabbitMQ je primary message broker*

### 4. Redis Cache Layer (Port 6379)
- **Key-Value** caching sa password protection
- **Session Storage**
- **Rate Limiting** backend
- **Data Caching** za brže odgovore
- **AOF Persistence** - append-only file za durability
- **Memory Management** - LRU eviction policy (512MB max)
- **Pub/Sub** messaging support

### 5. Envoy Proxy (Port 10000/8443, Admin: 9901) - Optional
- **Alternative API Gateway** - može se koristiti umesto Kong-a
- **High Performance** proxy
- **HTTP/HTTPS** routing
- **Admin Interface** za monitoring

### 6. PostgreSQL (Port 5432)
- **Shared Database** za Kong konfiguraciju
- **Primary Database** za aplikacijske podatke

## Pokretanje

### Start infrastrukture
```bash
cd infrastructure
docker-compose up -d
```

### Status provera
```bash
docker-compose ps
```

### Logovi
```bash
# Svi servisi
docker-compose logs -f

# Specifičan servis
docker-compose logs -f kong
docker-compose logs -f haproxy
docker-compose logs -f rabbitmq
docker-compose logs -f nats
docker-compose logs -f redis
docker-compose logs -f envoy
```

## Pristup servisima

### Preko HAProxy (Port 80)
```
http://localhost/api/customers
http://localhost/api/invoices
http://localhost/api/orders
```

### Preko Kong Gateway (Port 8000)
```
http://localhost:8000/api/registry/customers
http://localhost:8000/api/invoices
```

### Kong Admin API (Port 8001)
```
http://localhost:8001/services
http://localhost:8001/routes
http://localhost:8001/plugins
```

### Konga UI (Port 1337)
```
http://localhost:1337
```

### HAProxy Stats (Port 8404)
```
http://localhost:8404/stats
```

### RabbitMQ Management UI (Port 15672)
```
http://localhost:15672
Username: rabbitmq_user
Password: rabbitmq_pass_change_in_production
```

### NATS Monitoring (Port 8222)
```
http://localhost:8222
http://localhost:8222/connz
http://localhost:8222/varz
```

### Envoy Admin Interface (Port 9901)
```
http://localhost:9901/server_info
```

## Konfiguracija

### Kong Services

Kong servisi su definisani u `kong/kong.yml`:

- **registry-service** - `/api/registry`, `/api/customers`, `/api/companies`
- **invoices-service** - `/api/invoices`, `/api/payments`, `/api/dunnings`
- **orders-service** - `/api/orders`
- **delivery-service** - `/api/delivery`, `/api/delivery-notes`
- **offers-service** - `/api/offers`

### Kong Plugins

Svaki servis ima konfigurisane:
- **rate-limiting** - 100 zahteva/min, 1000/h
- **cors** - Cross-origin support
- **correlation-id** - Request tracking
- **request-transformer** - Header transformation

### HAProxy Backends

HAProxy konfiguracija u `haproxy/haproxy.cfg`:
- **kong-backend** - Glavni backend ka Kong Gateway-u
- Opcioni direct backends za svaki servis

## Event Bus - NATS

### Publish Event
```javascript
const nats = require('nats');

const nc = await nats.connect('nats://localhost:4222');
await nc.publish('invoice.created', JSON.stringify({
  id: 'invoice-123',
  customerId: 'customer-456'
}));
```

### Subscribe to Events
```javascript
const sub = nc.subscribe('invoice.created');
for await (const msg of sub) {
  const data = JSON.parse(msg.data);
  console.log('Invoice created:', data);
}
```

## Cache Layer - Redis

### Connect to Redis
```bash
docker exec -it collector-redis redis-cli -a $REDIS_PASSWORD
```

### Basic Commands
```redis
# Authenticate
AUTH redis_password_change_in_production

# Set value
SET key value
SETEX key 3600 value  # With expiration

# Get value
GET key

# Delete
DEL key

# Pattern match
KEYS invoice:*

# Increment
INCR counter

# JSON operations (via client)
```

### Using Redis Client in Services
```typescript
import { getRedisClient } from '@/shared/redis-client';

const redis = getRedisClient();
await redis.connect();

// Cache operations
await redis.setJSON('invoice:123', invoiceData, 3600);
const invoice = await redis.getJSON<Invoice>('invoice:123');

// Cache with fallback
const data = await redis.cache('key', async () => {
  return await fetchFromDatabase();
}, 3600);
```

## Message Broker - RabbitMQ

### Connect via Management UI
```
http://localhost:15672
Username: rabbitmq_user
Password: rabbitmq_pass_change_in_production
```

### Using RabbitMQ Client in Services
```typescript
import { getRabbitMQClient } from '@/shared/rabbitmq-client';

const rabbitmq = getRabbitMQClient();
await rabbitmq.connect();

// Publish event
await rabbitmq.publishEvent('orders.created', {
  orderId: '123',
  customerId: '456'
});

// Subscribe to event
await rabbitmq.subscribeToEvent('orders.created', async (data) => {
  console.log('Order created:', data);
});
```

### Predefined Queues & Exchanges
- **Queues**: `orders.created`, `orders.updated`, `invoices.created`, `invoices.paid`, `delivery.dispatched`, `delivery.delivered`, `inventory.stock-updated`
- **Exchanges**: `collector.events`, `orders.exchange`, `invoices.exchange`, `delivery.exchange`, `inventory.exchange`

## Monitoring

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

### Metrics
- **Kong**: http://localhost:8001/metrics
- **HAProxy**: http://localhost:8404/stats
- **NATS**: http://localhost:8222/varz

## Security

### SSL/TLS
HAProxy podržava SSL termination. Dodaj sertifikat u `haproxy/certs/`.

### JWT Authentication
Kong može biti konfigurisan sa JWT plugin-om za autentifikaciju:

```bash
# Kroz Kong Admin API
curl -X POST http://localhost:8001/services/{service}/plugins \
  --data "name=jwt"
```

## Troubleshooting

### Kong nije pokrenut
```bash
# Proveri logove
docker-compose logs kong

# Proveri Kong database
docker-compose exec kong-database psql -U kong_user -d kong_db
```

### HAProxy ne radi
```bash
# Proveri konfiguraciju
docker-compose exec haproxy haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg

# Proveri logove
docker-compose logs haproxy
```

### NATS connection issues
```bash
# Test konekcije
nc -zv localhost 4222

# Proveri status
curl http://localhost:8222/varz
```

### Redis connection issues
```bash
# Test konekcije
docker exec collector-redis redis-cli ping

# Proveri logove
docker-compose logs redis
```

## Production Considerations

1. **SSL Certificates** - Dodaj prave SSL sertifikate za production
2. **Secrets Management** - Koristi secrets manager umesto hardcoded lozinki
3. **High Availability** - Dodaj više instanci za HA
4. **Monitoring** - Integriši Prometheus/Grafana
5. **Logging** - Centralizovano logovanje (ELK stack)
6. **Backup** - Automatski backup za PostgreSQL i Redis

## Next Steps

1. Dodaj API Gateway autentifikac جاiju
2. Konfiguriši SSL sertifikate
3. Dodaj monitoring i alerting
4. Setup CI/CD pipeline
5. Konfiguriši backup strategiju

