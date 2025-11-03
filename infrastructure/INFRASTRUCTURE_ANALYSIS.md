# Collector Platform - Kompletna Analiza Infrastrukture

## 📋 Pregled Komponenti

Ova dokumentacija opisuje sve infrastrukturne komponente Collector platforme sa detaljnom analizom, konfiguracijom i uputstvima za korišćenje.

## 🏗️ Arhitektura Infrastrukture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Requests                          │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────▼───────────────┐
        │      HAProxy (Port 80/443)    │  Load Balancer
        │    - SSL Termination          │  - Health Checks
        │    - Request Routing          │  - Stats Dashboard
        └───────────────┬───────────────┘
                        │
        ┌───────────────▼───────────────┐
        │   Kong/Envoy API Gateway      │  API Gateway Layer
        │   - Rate Limiting             │  - Authentication
        │   - Request Transformation    │  - Routing & Load Balancing
        └───────────────┬───────────────┘
                        │
        ┌───────────────▼───────────────┐
        │      Microservices Layer      │
        │  ┌────────┐ ┌────────┐       │
        │  │Registry│ │Inventory│       │
        │  │Orders  │ │Delivery │       │
        │  │Invoices│ │Offers   │       │
        │  └────────┘ └────────┘       │
        └───────────────┬───────────────┘
                        │
        ┌───────────────▼───────────────┐
        │    Data & Message Layer       │
        │  ┌────────┐ ┌────────┐       │
        │  │Postgres│ │ RabbitMQ│       │
        │  │ Redis  │ │  NATS  │       │
        │  └────────┘ └────────┘       │
        └───────────────────────────────┘
```

## 1. 🔴 Redis - Cache Layer

### Opis
Redis je in-memory key-value store koji se koristi za caching, session management, rate limiting i pub/sub messaging.

### Verzija
- **Image**: `redis:7-alpine`
- **Port**: `6379`

-supported Features

- ✅ Password Authentication
- ✅ AOF (Append Only File) Persistence
- ✅ RDB Snapshots
- ✅ Memory Management (max 512MB, LRU eviction)
- ✅ Pub/Sub messaging
- ✅ Transaction support
- ✅ Lua scripting

-supported

### Konfiguracija

#### Docker Compose Konfiguracija
```yaml
redis:
  image: redis:7-alpine
  command: >
    redis-server
    --appendonly yes
    --requirepass ${REDIS_PASSWORD}
    --maxmemory 512mb
    --maxmemory-policy allkeys-lru
```

#### Redis Configuration File
Lokacija: `infrastructure/redis/redis.conf`

Ključne postavke:
- **Persistenc**:
  - AOF: `appendonly yes` - append-only file za durability
  - RDB snapshots: automatski save na 60s/300s/900s
- **Memory Management**:
  - `maxmemory 512mb` - maksimalna memorija
  - `maxmemory-policy allkeys-lru` - LRU eviction policy
- **Security**:
  - `requirepass` - password zahtevan za sve operacije
  - Protected mode enabled

### Korišćenje u Microservisima

#### TypeScript Client (RedisClient)
Lokacija: `services/shared/redis-client.ts`

**Osnovno korišćenje:**
```typescript
import { getRedisClient } from '@/shared/redis-client';

const redis = getRedisClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD
});

await redis.connect();

// Cache operations
await redis.set('user:123', JSON.stringify(userData), 3600); // TTL 1 hour
const user = await redis.get('user:123');

// JSON caching helper
await redis.setJSON('invoice:456', invoiceData, 3600);
const invoice = await redis.getJSON<Invoice>('invoice:456');

// Cache with fallback
const data = await redis.cache('key', async () => {
  return await fetchFromDatabase();
}, 3600);
```

**Dostupne Operacije:**
- String: `get`, `set`, `delete`, `expire`, `ttl`
- Hash: `hGet`, `hSet`, `hGetAll`, `hDel`
- List: `lPush`, `rPush`, `lPop`, `rPop`, `lRange`
- Set: `sAdd`, `sRemove`, `sMembers`, `sIsMember`
- Pub/Sub: `publish`, `subscribe`
- Pattern matching: `keys`, `scan`
- Cache helper: `cache<T>()` - generic cache sa TTL

### Use Cases u Collector Platformi

1. **Session Storage**
   ```typescript
   await redis.set(`session:${sessionId}`, userSession, 1800); // 30 min
   ```

2. **Rate Limiting**
   ```typescript
   const key = `ratelimit:${userId}:${endpoint}`;
   const count = await redis.increment(key, 1);
   if (count === 1) await redis.expire(key, 60); // 1 minute window
   ```

3. **Cache API Responses**
   ```typescript
   const cached = await redis.cache(`api:customers:${customerId}`, 
     async () => await customerService.getById(customerId),
     3600 // 1 hour cache
   );
   ```

4. **Distributed Locking**
   ```typescript
   const lockKey = `lock:order:${orderId}`;
   const locked = await redis.set(lockKey, '1', 'EX', 10, 'NX'); // 10s lock
   ```

5. **Pub/Sub Events**
   ```typescript
   await redis.publish('order.created', JSON.stringify(orderData));
   ```

### Monitoring & Health Checks

```bash
# Health check
docker exec collector-redis redis-cli -a $REDIS_PASSWORD ping

# Info
docker exec collector-redis redis-cli -a $REDIS_PASSWORD INFO

# Memory usage
docker exec collector-redis redis-cli -a $REDIS_PASSWORD INFO memory

# Monitor commands
docker exec collector-redis redis-cli -a $REDIS_PASSWORD MONITOR
```

### Best Practices

1. **TTL za sve cache keys** - postaviti expiration da se oslobodi memorija
2. **Connection pooling** - koristiti singleton Redis client
3. **Error handling** - handle connection errors gracefully
4. **Memory monitoring** - pratiti memory usage i dodavati limits
5. **Persistence** - kombinovati AOF i RDB snapshots

---

## 2. 🚪 Kong API Gateway

### Opis
Kong je cloud-native API gateway koji omogućava routing, authentication, rate limiting, load balancing i monitoring.

### Verzija
- **Image**: `kong:3.6`
- **Ports**:
  - Proxy: `8000` (HTTP), `8443` (HTTPS)
  - Admin API: `8001` (HTTP), `8444` (HTTPS)

### Funkcionalnosti

- ✅ Request Routing - ruting zahteva ka superiority servisima
- ✅ Rate Limiting - 100 req/min, 1000 req/h per service
- ✅ CORS - Cross-Origin Resource Sharing
- ✅ JWT Authentication - ready za JWT auth
- ✅ Request/Response Transformation - header transformation
- ✅ Correlation ID - request tracking
- ✅ Load Balancing - round-robin balancing
- ✅ Health Checks - automatska provera zdravlja servisa
- ✅ Logging - access i error logs

### Konfiguracija

#### Services i Routes
Lokacija: `infrastructure/kong/kong.yml`

**Definisani Servisi:**
- `registry-service` - `/api/registry`, `/api/customers`, `/api/companies`
- `invoices-service` - `/api/invoices`, `/api/payments`, `/api/dunnings`
- `orders-service` - `/api/orders`
- `delivery-service` - `/api/delivery`, `/api/delivery-notes`
- `offers-service` - `/api/offers`

**Plugins per Service:**
- `rate-limiting` - 100/minute, 1000/hour
- `cors` - cross-origin support
- `correlation-id` - request tracking (X-Request-ID)
- `request-transformer` - header transformation

### Primeri Korišćenja

#### Kreiranje Service kroz Admin API
```bash
curl是 -X POST http://localhost:8001/services \
  --data "name=my-service" \
  --data "url=http://my-service:3000"
```

#### Dodavanje Route
```bash
curl -X POST http://localhost:8001/services/my-service/routes \
  --data "paths[]=/api/my-service" \
  --data "strip_path=true"
```

#### Dodavanje Plugin-a
```bash
curl -X POST http://localhost:8001/services/my-service/plugins \
  --data "name=rate-limiting" \
  --data "config.minute=100"
```

### Konga Management UI

- **URL**: http://localhost:1337
- **Features**: 
  - Visual service/route management
  - Plugin configuration
  - Monitoring dashboard
  - Consumer management

### Monitoring

```bash
# Health check
curl http://localhost:8001/health

# Metrics
curl http://localhost:8001/metrics

# Services list
curl http://localhost:8001/services

# Routes list
curl http://localhost:8001/routes
```

---

## 3. 🌐 Envoy Proxy (Alternative API Gateway)

### Opis
Envoy je high-performance proxy koji može biti alternativa Kong-u za API gateway funkcionalnost.

### Verzija
- **Image**: `envoyproxy/envoy:v1.30-latest`
- **Ports**:
  - HTTP: `10000`
  - HTTPS: `8443`
  - Ao: `9901`

### Konfiguracija

Lokacija: `infrastructure/envoy/envoy.yaml`

**Features:**
- HTTP/HTTPS listeners
- Route configuration za sve servise
- Admin interface
- Access logging
- Health checks

**Rute:**
- `/api/registry/*` → registry-service:3001
- `/api/invoices/*` → invoices-service:3002
- `/api/orders/*` → orders-service:3003
- `/api/delivery/*` → delivery-service:3004
- `/api/offers/*` → offers-service:	endpoint

### Korišćenje

```bash
# Health check
curl http://localhost:9901/server_info

# McCutche services
curl http://localhost:10000/api/orders
```

### Kong vs Envoy

| Feature | Kong | Envoy |
|---------|------|-------|
| Setup | ⭐⭐⭐ Easy | ⭐⭐ Moderate |
| Plugins | ⭐⭐⭐ Extensive | ⭐⭐ Limited |
| Performance | ⭐⭐⭐ Very Good | ⭐⭐⭐ Excellent |
| Configuration | Declarative YAML | YAML/JSON |
| Management UI | Konga available | Admin API only |
| Best For | Feature-rich gateway | High-performance proxy |

**Preporuka**: Koristiti **Kong** za production zbog plugins ekosistema, ili **Envoy** za maksimalnu performansu.

---

## 4. ⚖️ HAProxy - Load Balancer

### Opis
HAProxy je high-performance TCP/HTTP load balancer koji distribuira zahteve ka backend servisima.

### Verzija
- **Image**: `haproxy:2.9-alpine`
- **Ports**:
  - HTTP: `80`
  - HTTPS: `443`
  - Stats: `8404`
  - Health: `9999`

### Funkcionalnosti

- ✅ Load Balancing - round-robin, least-conn, source algorithms
- ✅ Health Checks - HTTP health checks
- ✅ SSL Termination - HTTPS support
- ✅ Stats Dashboard - real-time monitoring
- ✅ Request Routing - routing ka Kong Gateway
- ✅ Connection Pooling - connection reuse

### Konfiguracija

Lokacija: `infrastructure/haproxy/haproxy.cfg`

**Frontend Configuration:**
- HTTP listener na portu 80
- HTTPS listener na portu 443 (SSL termination)
- Automatic HTTP → HTTPS redirect
- CORS headers

**Backend Configuration:**
- `kong-backend` - glavni backend ka Kong Gateway
- Optional direct backends za svaki servis
- Health checks na svakom backendu
- Round-robin load balancing

### Monitoring

```bash
# Stats Dashboard
open http://localhost:8404/stats

# Health check
curl http://localhost:9999

# Check configuration
docker exec collector-haproxy haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg
```

### Best Practices

1. **Health Checks** - konfigurisati za svaki backend
2. **SSL Termination** - koristiti SSL na HAProxy nivou
3. **Connection Limits** - postaviti `maxient` za spprečavanje overload-a
4. **Stats Dashboard** - ograničiti pristup sa password protection
5. **Logging** - enable access logs za monitoring

---

## 5. 🐰 RabbitMQ - Message Broker

### Opis
RabbitMQ je message broker koji omogućava async messaging između microservisa koristeći AMQP protokol.

### Verzija
- **Image**: `rabbitmq:3-management-alpine`
- **Ports**:
  - AMQP: `5672`
  - Management UI: `15672`
  - Cluster: `25672`

### Funkcionalnosti

- ✅ Message Queues - durable, priority queues
- ✅ Exchanges - topic, direct, fanout, headers
- ✅ Routing - flexible routing keys
- ✅ Message Persistence - disk persistence
- ✅ High Availability - HA queues, clustering
- ✅ Dead Letter Queues - failed message handling
- ✅ Management UI - web-based administration

### Konfiguracija

#### RabbitMQ Config
Lokacija: `infrastructure/rabbitmq/rabbitmq.conf`

**Ključne Postavke:**
- Memory limit: 60% of available
- Disk free limit: 2GB
- Heartbeat: 60 seconds
- Management plugin enabled
- Prometheus metrics enabled

#### Definitions (Queues, Exchanges, Bindings)
Lokacija: `infrastructure/rabbitmq/definitions.json`

**Predefinisane Queue-e:**
- `orders.created` - nova porudžbina kreirana
- `orders.updated` - porudžbina ažurirana
- `invoices.created` - faktura kreirana
- `invoices.paid` - faktura plaćena
- `delivery.dispatched` - pošiljka otpremljena
- `delivery.delivered` - pošiljka dostavljena
- `inventory.stock-updated` - zalihe ažurirane

**Predefinisani Exchange-i:**
- `collector.events` - glavni events exchange (topic)
- `orders.exchange` - orders events (topic)
- `invoices.exchange` - invoices events (topic)
- `delivery.exchange` - delivery events (topic)
- `inventory.exchange` - inventory events (topic)
- `req.dead-letter` - dead letter queue exchange (fanout)

### Korišćenje u Microservisima

#### TypeScript Client (RabbitMQClient)
Lokacija: `services/shared/rabbitmq-client.ts`

**Osnovno Korišćenje:**
```typescript
import { getRabbitMQClient } from '@/shared/rabbitmq-client';

const rabbitmq = getRabbitMQClient({
  hostname: process.env.RABBITMQ_HOST || 'localhost',
  username: process.env.RABBITMQ_USER,
  password: process.env.RABBITMQ_PASSWORD,
  vhost: process.env.RABBITMQ_VHOST || 'collector'
});

await rabbitmq.connect();

// Publish message
await rabbitmq.publish('orders.exchange', 'orders.created', {
  orderId: '123',
  customerId: '456',
  total: 1000
});

// Subscribe to messages
await rabbitmq.consume('orders.created', async (message) => {
  if (!message) return;
  
  const data = JSON.parse(message.content.toString());
  console.log('Order created:', data);
}, {
  exchange: 'orders.exchange',
  routingKey: 'orders.created'
});
```

**Event Publishing Helper:**
```typescript
// Publish event
await rabbitmq.publishEvent('invoices.created', {
  invoiceId: 'inv-123',
  customerId: 'cust-456',
  amount: 500
});

// Subscribe to event pattern
await rabbitmq.subscribeToEvent('invoices.*', async (data, routingKey) => {
  console.log(`Event ${routingKey}:`, data);
});
```

### Use Cases u Collector Platformi

1. **Order Processing**
   ```typescript
   // Orders service publishes
   await rabbitmq.publishEvent('orders.created', orderData);
   
   // Inventory service consumes
   await rabbitmq.subscribeToEvent('orders.created', async (data) => {
     await inventoryService.reserveStock(data.items);
   });
   ```

2. **Invoice Generation**
   ```typescript
   // Orders service publishes
   await rabbitmq.publishEvent('orders.completed', orderData);
   
   // Invoices service consumes
   await rabbitmq.subscribeToEvent('orders.completed', async (data) => {
     await invoiceService.createInvoice(data);
   });
   ```

3. **Delivery Tracking**
   ```typescript
   // Delivery service publishes
   await rabbitmq.publishEvent('delivery.dispatched', deliveryData);
   
   // Orders service consumes
   await rabbitmq.subscribeToEvent('delivery.dispatched', async (data) => {
     await orderService.updateStatus(data.orderId, 'dispatched');
   });
   ```

4. **Inventory Updates**
   ```typescript
   // Delivery service publishes
   await rabbitmq.publishEvent('delivery.delivered', deliveryData);
   
   // Inventory service consumes
   await rabbitmq.subscribeToEvent('delivery.delivered', async (data) => {
     await inventoryService.adjustStock(data.items);
   });
   ```

### Management UI

- **URL**: http://localhost:15672
- **Username**: `rabbitmq_user`
- **Password-b**: `rabbitmq_pass_change_in_production`

**Features:**
- Queue monitoring
- Exchange management
- Connection monitoring
- Message browsing
- Performance metrics
- Cluster status

### Monitoring & Health Checks

```bash
# Health check
docker exec collector-rabbitmq rabbitmq-diagnostics ping

# Node status
docker exec collector-rabbitmq rabbitmqctl status

# Queue info
docker exec collector-rabbitmq rabbitmqctl list_queues

# Exchange info
docker exec collector-rabbitmq rabbitmqctl list_exchanges

# Management API
curl -u rabbitmq_user:password http://localhost:15672/api/overview
```

### Best Practices

1. **Durable Queues** - koristiti za critical messages
2. **Message Acknowledgments** - wait for ack before removing from queue
3. **Dead Letter Queues** - handle failed messages
4. **TTL** - set expiration for temporary messages
5. **Prefetch** - limit unacked messages per consumer
6. **Connection Pooling** - reuse connections
7. **Error Handling** - retry logic and dead letter handling

---

## 6. 📊 NATS (Optional - Alternative Message Broker)

### Opis
NATS je lightweight message broker alternativa RabbitMQ-u, optimizovan za high-performance messaging.

### Kada Koristiti NATS vs RabbitMQ

| Feature | NATS | RabbitMQ |
|---------|------|----------|
| Performance | ⭐⭐⭐ Excellent | ⭐⭐⭐ Very Good |
| Setup | ⭐⭐⭐ Simple | ⭐⭐ Moderate |
| Features | ⭐⭐ Basic | ⭐⭐⭐ Advanced |
| Durability | ⭐⭐ JetStream | ⭐⭐⭐ Native |
| Best For | High-throughput, ephemeral | Complex routing, durability |

**Preporuka**: Koristiti **RabbitMQ** za production zbog durability i advanced features, ili **NATS** za high-throughput scenarios.

---

## 🔧 Environment Variables

### Redis
```bash
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_change_in_production
REDIS_DB=0
```

### RabbitMQ
```bash
RABBITMQ_URL=amqp://rabbitmq_user:password@localhost:5672/collector
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=rabbitmq_user
RABBITMQ_PASSWORD=rabbitmq_pass_change_in_production
RABBITMQ_VHOST=collector
RABBITMQ_EXCHANGE=collector.events
```

### Kong
```bash
KONG_DATABASE=postgres
KONG_PG_HOST=kong-database
KONG_PG_USER=kong_user
KONG_PG_PASSWORD=kong_pass
KONG_PG_DATABASE=kong_db
```

---

## 🚀 Pokretanje Infrastrukture

### Full Stack
```bash
cd infrastructure
docker-compose up -d
```

### Individual Services
```bash
# Redis only
docker-compose up -d redis

# RabbitMQ only
docker-compose up -d rabbitmq

# Kong only
docker-compose up -d kong-database kong-migration kong

# HAProxy only
docker-compose up -d haproxy
```

### Status Check
```bash
docker-compose ps
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f redis
docker-compose logs -f rabbitmq
docker-compose logs -f kong
```

---

## 📈 Monitoring Dashboard Access

| Service | URL | Credentials |
|---------|-----|-------------|
| HAProxy Stats | http://localhost:8404/stats | - |
| Kong Admin API | http://localhost:8001 | - |
| Konga UI | http://localhost:1337 | Setup required |
| RabbitMQ Management | http://localhost:15672 | rabbitmq_user / password |
| Envoy Admin | http://localhost:9901 | - |
| NATS Monitoring | http://localhost:8222 | - |

---

## 🔐 Security Best Practices

1. **Change Default Passwords** - promeniti sve default passwords
2. **Use SSL/TLS** - enable HTTPS za sve endpoints
3. **Network Isolation** - koristiti Docker networks
4. **Firewall Rules** - ograničiti pristup prema potrebi
5. **Secrets Management** - koristiti secrets manager umesto env vars
6. **Rate Limiting** - enable rate limiting na gateway nivou
7. **Authentication** - implementirati JWT authentication

---

## 🐛 Troubleshooting

### Redis Connection Issues
```bash
# Test connection
docker exec collector-redis redis-cli -a $REDIS_PASSWORD ping

# Check logs
docker-compose logs redis

# Check memory
docker exec collector-redis redis-cli -a $REDIS_PASSWORD INFO memory
```

### RabbitMQ Connection Issues
```bash
# Test connection
docker exec collector-rabbitmq rabbitmq-diagnostics ping

# Check status
docker exec collector-rabbitmq rabbitmqctl status

# Check logs
docker-compose logs rabbitmq
```

### Kong Issues
```bash
# Health check
curl http://localhost:8001/health

# Check logs
docker-compose logs kong

# Verify database
docker-compose exec kong-database psql -U kong_user -d kong_db
```

### HAProxy Issues
```bash
# Test configuration
docker exec collector-haproxy haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg

# Check logs
docker-compose logs haproxy

# Check stats
curl http://localhost:8404/stats
```

---

## 📚 Dodatni Resursi

- **Redis Docs**: https://redis.io/documentation
- **RabbitMQ Docs**: https://www.rabbitmq.com/documentation.html
- **Kong Docs**: https://docs.konghq.com/
- **Envoy Docs**: https://www.envoyproxy.io/docs
- **HAProxy Docs**: http://www.haproxy.org/#docs

---

## ✅ Checklist za Production Deployment

- [ ] Change all default passwords
- [ ] Configure SSL certificates
- [ ] Setup secrets management
- [ ] Enable monitoring and alerting
- [ ] Configure backup strategy
- [ ] Setup high availability (clustering)
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Setup log aggregation
- [ ] Configure resource limits
- [ ] Test disaster recovery
- [ ] Document runbooks

---

*Poslednje ažuriranje: $(date)*

