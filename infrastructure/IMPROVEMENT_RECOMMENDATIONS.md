# Predlozi za Unapređenje Infrastrukture - Collector Platform

## 📊 Executivni Sažetak

Ova analiza identifikuje oblasti za unapređenje trenutne infrastrukture Collector platforme i predlaže konkretne izmene za povećanje sigurnosti, performansi, skalabilnosti i pouzdanosti sistema.

### Prioritet Skill Matrix

| Oblast | Trenutno Stanje | Prioritet | Kompleksnost | Impact |
|--------|----------------|-----------|--------------|--------|
| Security | ⚠️ Osnovni | 🔴 Visok | Srednja | Visok |
| High Availability | ⚠️ Nema | 🔴 Visok | Visoka | Visok |
| Monitoring/Observability | ⚠️ Ograničeno | 🟡 Srednji | Srednja | Visok |
| Performance | ✅ Dobro | 🟢 Nizak | Niska | Srednji |
| Disaster Recovery | ⚠️ Nema | 🟡 Srednji | Visoka | Srednji |
| Scalability | ✅ Osnovno | 🟡 Srednji | Srednja | Visok |

---

## 1. 🔐 Security Improvements

### 1.1 Secrets Management

**Trenutno Stanje:**
- ❌ Hardcoded passwords u docker-compose.yml
- ❌ Environment variables u plain text blizu koda
- ❌ Nema rotation mehanizma

**Predlog:**
```yaml
# Dodati Docker Secrets ili external secrets manager
services:
  redis:
    secrets:
      - redis_password
    environment:
      REDIS_PASSWORD_FILE: /run/secrets/redis_password

secrets:
  redis_password:
    external: true
  rabbitmq_password:
    external: true
  kong_db_password:
    external: true
```

**Implementacija:**
1. **Kratkoročno**: Docker Secrets za development
2. **Srednjoročno**: HashiCorp Vault ili AWS Secrets Manager za production
3. **Dugoročno**: Kubernetes Secrets sa devices poput External Secrets Operator

**Prioritet**: 🔴 Visok  
**Effort**: 2-3 dana  
**Impact**: Visok - Eliminiše security risk

---

### 1.2 Network Security

**Trenutno Stanje:**
- ⚠️ Sve servise su na istom Docker networku
- ⚠️ Nema network segmentation
- ⚠️ Svaki servis može pristupiti svakom

**Predlog:**
```yaml
networks:
  frontend-network:
    driver: bridge
    internal: false  # Može pristupiti internetu
  backend-network:
    driver: bridge
    internal: true   # Izolovan od interneta
  database-network:
    driver: bridge
    internal: true

services:
  haproxy:
    networks:
      - frontend-network
  
  kong:
    networks:
      - frontend-network
      - backend-network
  
  postgres:
    networks:
      - database-network
  
  redis:
    networks:
      - database-network
```

**Benefiti:**
- Network segmentation - zaštita od lateral movement
- Minimal privileges - svaki servis ima samo potrebne resurse
- Podrška za compliance (SOC 2, GDPR)

**Prioritet**: 🔴 Visok  
**Effort**: 1 dan  
**Impact**: Visok

---

### 1.3 SSL/TLS Certificates

**Trenutno Stanje:**
- ❌ Nema SSL sertifikata
- ❌ HTTPS nije konfigurisan
- ❌ Self-signed certs u development

**Predlog:**
```yaml
services:
  haproxy:
    volumes:
      - ./certs/collector.crt:/etc/ssl/certs/collector.crt:ro
      - ./certs/collector.key:/etc/ssl/private/collector.key:ro
    command: >
      haproxy
      -f /usr/local/etc/haproxy/haproxy.cfg
      -D
```

**Dodati u haproxy.cfg:**
```haproxy
frontend https_frontend
    bind *:443 ssl crt /etc/ssl/certs/collector.crt
    http-request redirect scheme https unless { ssl_fc }
    default_backend kong-backend
```

**Implementacija:**
1. **Development**: Self-signed certs sa mkcert
2. **Staging**: Let's Encrypt Staging
3. **Production**: Let's Encrypt Production sa auto-renewal (Certbot)

**Prioritet**: 🔴 Visok  
**Effort**: 1 dan  
**Impact**: Visok - Obavezan za production

---

### 1.4 Authentication & Authorization

**Trenutno Stanje:**
 - ⚠️ Kong ima JWT plugin, ali nije aktiviran
 - ⚠️ Nema centralizovane autentikacije
 - ⚠️ Svaki servis ima sopstveni mehanizam autentikacije

**Predlog:**
```yaml
# Kong JWT Plugin Configuration
plugins:
  - name: jwt
    config:
      uri_param_names: ["jwt", "token"]
      claims_to_verify: ["exp", "iat"]
      secret_is_base64: false
      run_on_preflight: true
  - name: oidc
    config:
      issuer: https://auth.collector.local
      client_id: collector-api
      client_secret: ${KONG_OIDC_SECRET}
```

**Implementacija:**
1. **Faza 1**: Aktivirati JWT plugin u Kong-u za sve servise
2. **Faza 2**: Integracija sa OAuth2/OIDC provider (Keycloak/Auth0)
3. **Faza 3**: RBAC (Role-Based Access Control) u Kong-u

**Plan migracije sa per-servis autentikacije na centralizovanu (Kong + OIDC):**
1. Uvesti centralizovanu autentikaciju na `Kong` nivou preko `oidc` plugina (Keycloak kao IdP).
2. Na servisima ukloniti login/token validaciju i zadržati samo autorizaciju zasnovanu na clame-ovima koje propušta gateway.
3. Standardizovati prosleđivanje identiteta: `Kong` injektuje headere npr. `X-User-Id`, `X-User-Email`, `X-Roles`, `X-Tenant` izvedene iz ID/Access tokena.
4. Servisno-servisna komunikacija: koristiti OAuth2 Client Credentials flow (mašinski nalozi) ili mTLS, a validaciju raditi na gateway-u.
5. Definisati globalni skup uloga i opsega (scopes) u IdP: npr. `orders:read`, `orders:write`, `admin`.
6. Uvesti konzistentan model autorizacije u servisima (policy/ABAC ili jednostavan RBAC) koji čita samo trustovane headere.
7. Postepeno gasiti per-servis auth middleware-e (flag iza feature toggla), uz smoke i regresione testove.

**Primer (deklarativni) Kong setup za jedan servis/route:**
```yaml
services:
  - name: orders-service
    url: http://orders-service:4002
    routes:
      - name: orders-api
        paths: ["/api/orders"]
        strip_path: true
        plugins:
          - name: oidc
            config:
              issuer: https://auth.collector.local/realms/collector
              client_id: collector-api
              client_secret: ${KONG_OIDC_SECRET}
              scopes_required: ["openid", "profile", "email"]
              bearer_only: true
              verify_parameters: true
          - name: jwt
            config:
              claims_to_verify: ["exp", "iat"]
          - name: request-transformer
            config:
              add:
                headers:
                  - "X-User-Id:{{authenticated_userid}}"
                  - "X-User-Email:{{jwt.claim.email}}"
                  - "X-Roles:{{jwt.claim.realm_access.roles}}"
                  - "X-Scopes:{{jwt.claim.scope}}"
          - name: acl
            config:
              allow: ["orders-read", "orders-write", "admin"]
```

Napomena: Servisi ne treba da verifikuju JWT; verifikacija se radi u `Kong`. Servisi treba da veruju samo headerima koje je `Kong` postavio (drop nepoznatih headera na edge-u) i da sprovode domensku autorizaciju.

**Status realizacije:**
- [x] Uključen `jwt` plugin u `infrastructure/kong/kong.yml` za sve definisane servise (centralna verifikacija tokena na gateway-u)
- [x] Konfigurisan `request-transformer` za injekciju identity headera (`X-User-Id`, `X-Tenant-Id`, `X-User-Email`, `X-User-Roles`, `X-User-Scopes`)
- [x] OIDC plugin konfigurisan i spreman za aktivaciju (uncomment kada je provider spreman)
- [x] Kreiran shared identity middleware (`services/shared/identity-middleware/`)
- [x] Migriran `orders-service` sa feature toggle-om (`USE_KONG_AUTH`):
  - Hybrid mode (podrška i za Kong headere i za direktan JWT)
  - Kong-only mode (samo Kong headeri)
- [x] Dokumentacija: `AUTH_MIGRATION_GUIDE.md` i `AUTH_IMPLEMENTATION_SUMMARY.md`
- [ ] Migrirati preostale servise (template spreman u `orders-service`)

**Prioritet**: 🔴 Visok  
**Effort**: 3-5 dana  
**Impact**: Visok

---

### 1.5 Rate Limiting Improvements

**Trenutno Stanje:**
- ✅ Osnovni rate limiting (100/min, 1000/h) - fiksni limiti
- ⚠️ Nema diferencirani rate limiting po korisniku
- ⚠️ Nema adaptive rate limiting

**Predlog:**
```yaml
# Kong Rate Limiting sa Redis backend
plugins:
  - name: rate-limiting
    config:
      minute: 100
      hour: 1000
      policy: redis
      redis_host: redis
      redis_port: 6379
      redis_password: ${REDIS_PASSWORD}
      redis_database: 1
  - name: rate-limiting-advanced
    config:
      limit:
        - 100  # per minute
        - 1000 # per hour
      window_size:
        - 60
        - 3600
      identifier: consumer
      sync_rate: 10
```

**Dodatne Feature-ove:**
- IP-based rate limiting za DDoS protection
- User-based rate limiting (premium vs free)
- Adaptive rate limiting baziran na load

**Prioritet**: 🟡 Srednji  
**Effort**: 2 dana  
**Impact**: Srednji-Visok

---

## 2. 📈 High Availability (HA) & Fault Tolerance

### 2.1 Redis High Availability

**Trenutno Stanje:**
- ❌ Single Redis instance - Single Point of Failure (SPOF)
- ❌ Nema replication
- ❌ Nema failover mehanizma

**Predlog - Redis Sentinel:**
```yaml
services:
  redis-master:
    image: redis:7-alpine
    container_name: collector-redis-master
    command: redis-server --appendonly yes
    networks:
      - collector-network
  
  redis-replica:
    image: redis:7-alpine
    command: redis-server --replicaof redis-master 6379
    depends_on:
      - redis-master
  
  redis-sentinel:
    image: redis:7-alpine
    command: >
      redis-sentinel
      /etc/redis/sentinel.conf
    volumes:
      - ./redis/sentinel.conf:/etc/redis/sentinel.conf
    depends_on:
      - redis-master
```

**Alternativa - Redis Cluster:**
- 3 master + 3 replica семена
- Automatic failover
- Horizontalna skalabilnost

**Prioritet**: 🔴 Visok  
**Effort**: 3-5 dana  
**Impact**: Visok - Eliminiše SPOF

---

### 2.2 RabbitMQ Clustering

**Trenutno Stanje:**
- ❌ Single RabbitMQ instance
- ⚠️ HA queues konfigurisane ali nema cluster-a

**Predlog:**
```yaml
services:
  rabbitmq-node1:
    hostname: rabbit1
    environment:
      RABBITMQ_ERLANG_COOKIE: ${RABBITMQ_COOKIE}
      RABBITMQ_USE_LONGNAME: "true"
      RABBITMQ_NODENAME: rabbit@rabbit1
  
  rabbitmq-node2:
    hostname: rabbit2
    environment:
      RABBITMQ_ERLANG_COOKIE: ${RABBITMQ_COOKIE}
      RABBITMQ_USE_LONGNAME: "true"
      RABBITMQ_NODENAME: rabbit@rabbit2
    command: >
      sh -c "rabbitmq-server & sleep 10 && 
      rabbitmqctl stop_app && 
      rabbitmqctl join_cluster rabbit@rabbit1 && 
      rabbitmqctl start_app"
    depends_on:
      - rabbitmq-node1
```

**Benefiti:**
- Automatic failover
- Load distribution
- No message loss sa HA queues

**Prioritet**: 🔴 Visok  
**Effort**: 2-3 dana  
**Impact**: Visok

---

### 2.3 Kong High Availability

**Trenutno Stanje:**
- ❌ Single Kong instance
- ⚠️ Database-backed konfiguracija (dobar start)

**Predlog:**
```yaml
services:
  kong1:
    container_name: collector-kong-1
    environment:
      KONG_PROXY_LISTEN: 0.0.0.0:8000
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
  
  kong2:
    container_name: collector-kong-2
    environment:
      KONG_PROXY_LISTEN: 0.0.0.0:8000
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
```

**HAProxy Load Balancing:**
```haproxy
backend kong-backend
    balance roundrobin
    option httpchk GET /health
    server kong1 kong1:8000 check inter 10s fall 3 rise 2
    server kong2 kong2:8000 check inter 10s fall 3 rise 2 backup
```

**Prioritet**: 🔴 Visok  
**Effort**: 1 dan  
**Impact**: Visok

---

### 2.4 PostgreSQL High Availability

**Trenutno Stanje:**
- ❌ Single PostgreSQL instance
- ⚠️ Manual backup strategy

**Predlog - Patroni + etcd:**
```yaml
services:
  etcd:
    image: quay.io/coreos/etcd:v3.5.0
    environment:
      - ETCD_NAME=etcd
      - ETCD_DATA_DIR=/etcd-data
      - ETCD_LISTEN_CLIENT_URLS=http://0.0.0.0:2379
      - ETCD_ADVERTISE_CLIENT_URLS=http://etcd:2379
  
  postgres-master:
    image: postgres:16-alpine
    environment:
      PATRONI_SCOPE: collector
      PATRONI_ETCD_HOSTS: etcd:2379
  
  postgres-replica:
    image: postgres:16-alpine
    environment:
      PATRONI_SCOPE: collector
      PATRONI_ETCD_HOSTS: etcd:2379
```

**Alternativa - PostgreSQL Streaming Replication:**
- Master-Slave sa automatic failover
- Simpler setup
- Dovoljno za većinu use case-ova

**Prioritet**: 🟡 Srednji (za critical data)  
**Effort**: 3-5 dana  
**Impact**: Visok za data-critical servise

---

## 3. 📊 Monitoring & Observability

### 3.1 Comprehensive Monitoring Stack

**Trenutno Stanje:**
- ⚠️ Osnovni health checks
- ⚠️ Nema centralized monitoring
- ⚠️ Nema alerting

**Predlog - Prometheus + Grafana:**

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
  
  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
  
  alertmanager:
    image: prom/alertmanager:latest
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    ports:
      - "9093:9093"
```

**Metrics za Collection:**
- **System**: CPU, Memory, Disk, Network
- **Application**: Request rate, Latency, Error rate
- **Infrastructure**: Redis memory, RabbitMQ queue depth, DB connections

**Prioritet**: 🔴 Visok  
**Effort**: 3-5 dana  
**Impact**: Visok - Visibility u sistem

---

### 3.2 Distributed Tracing

**Trenutno Stanje:**
- ⚠️ Correlation ID u Kong-u (osnovno)
- ❌ Nema distributed tracing
- ❌ Teško debug-ovanje distributed requests

**Predlog - Jaeger/Zipkin:**
```yaml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411
    ports:
      - "5775:5775/udp"  # agent
      - "6831:6831/udp"  # agent
      - "6832:6832/udp"  # agent
      - "5778:5778"      # config
      - "16686:16686"    # UI
      - "14268:14268"    # collector
      - "14250:14250"    # collector grpc
      - "9411:9411"      # zipkin
```

**Kong OpenTracing Plugin:**
```yaml
plugins:
  - name: opentracing
    config:
      tracer: jaeger
      service_name: kong-gateway
```

**Prioritet**: 🟡 Srednji  
**Effort**: 2-3 dana  
**Impact**: Srednji-Visok za debugging

---

### 3.3 Centralized Logging

**Trenutno Stanje:**
- ⚠️ Logovi su samo u Docker stdout
- ⚠️ Nema centralizovanog log storage
- ⚠️ Teško pretraživanje i analiza

**Predlog - ELK Stack (Elasticsearch + Logstash + Kibana):**
```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
  
  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./monitoring/logstash/pipeline:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch
  
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

**Docker Logging Driver:**
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
    labels: "service"
```

**Prioritet**: 🟡 Srednji  
**Effort**: 3-4 dana  
**Impact**: Srednji-Visok

---

## 4. ⚡ Performance Optimizations

### 4.1 Redis Performance

**Trenutno Stanje:**
- ✅ Osnovna optimizacija (LRU, maxmemory)
- ⚠️ Nema connection pooling u aplikaciji
- ⚠️ Možda nema optimalne key naming conventions

**Predlog:**
```typescript
// Connection pooling u Redis client
const redis = createClient({
  socket: {
    host: 'redis',
    port: 6379,
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
  },
  password: process.env.REDIS_PASSWORD,
});

// Pipeline za batch operations
const pipeline = redis.pipeline();
for (const key of keys) {
  pipeline.get(key);
}
const results = await pipeline.exec();

// Redis Lua scripts za atomic operations
const script = `
  local current = redis.call('GET', KEYS[1])
  if current == nil then
    return redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
  end
  return current
`;
```

**Best Practices:**
- Key naming: `{service}:{entity}:{id}` (npr. `orders:invoice:123`)
- TTL na sve cache keys
- Batch operations gde je moguće

**Prioritet**: 🟢 Nizak  
**Effort**: 1-2 dana  
**Impact**: Srednji

---

### 4.2 RabbitMQ Performance

**Trenutno Stanje:**
- ✅ Durable queues
- ⚠️ Nema prefetch optimization
- ⚠️ Nema message compression

**Predlog:**
```typescript
// Prefetch optimization
await channel.prefetch(10); // Process 10 messages at a time

// Message compression
const compressed = gzip(JSON.stringify(data));
await channel.publish(exchange, routingKey, compressed, {
  headers: { 'compression': 'gzip' }
});

// Batch publishing
const batch = [];
for (const message of messages) {
  batch.push({ exchange, routingKey, content: message });
}
await channel.publishBatch(batch);
```

**RabbitMQ Tuning:**
```conf
# rabbitmq.conf optimizations
vm_memory_high_watermark.relative = 0.4  # 40% memory usage
disk_free_limit.absolute = 5GB
heartbeat = 30  # Shorter heartbeat za faster failover
```

**Prioritet**: 🟢 Nizak  
**Effort**: 1 dan  
**Impact**: Srednji

---

### 4.3 Database Connection Pooling

**Trenutno Stanje:**
- ⚠️ Možda nema connection pooling u servisima
- ⚠️ Risiko connection exhaustion

**Predlog:**
```typescript
// Prisma connection pooling
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 10  // Max connections per instance
  pool_timeout = 10
}

// PgBouncer za connection pooling
services:
  pgbouncer:
    image: edoburu/pgbouncer:latest
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_USER: collector_user
      DATABASES_PASSWORD: ${POSTGRES_PASSWORD}
      DATABASES_DBNAME: collector_db
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 25
    ports:
      - "6432:6432"
```

**Prioritet**: 🟡 Srednji  
**Effort**: 1-2 dana  
**Impact**: Srednji-Visok

---

## 5. 🚀 Scalability Improvements

### 5.1 Horizontal Scaling Strategy

**Trenutno Stanje:**
- ⚠️ Stateless servisi (dobar start)
- ⚠️ Nema auto-scaling konfiguracije
- ⚠️ Manual scaling proces

**Predlog - Docker Swarm / Kubernetes:**
```yaml
# docker-compose.yml za Docker Swarm
version: '3.8'
deploy:
  replicas: 3
  update_config:
    parallelism: 1
    delay: 10s
  restart_policy:
    condition: on-failure
    delay: 5s
    max_attempts: 3
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

**Kubernetes Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: orders-service
  template:
    metadata:
      labels:
        app: orders-service
    spec:
      containers:
      - name: orders-service
        image: collector/orders-service:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: orders-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: orders-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**Prioritet**: 🟡 Srednji  
**Effort**: 5-7 dana za Kubernetes  
**Impact**: Visok za scaling

---

### 5.2 Database Read Replicas

**Trenutno Stanje:**
- ❌ Single database instance za čitanje i pisanje
<suggestions>
**Predlog:**
```yaml
services:
  postgres-primary:
    image: postgres:16-alpine
    environment:
      POSTGRES_REPLICATION_MODE: master
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: ${REPLICATION_PASSWORD}
  
  postgres-replica:
    image: postgres:16-alpine
    environment:
      POSTGRES_REPLICATION_MODE: slave
      POSTGRES_MASTER_HOST: postgres-primary
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: ${REPLICATION_PASSWORD}
```

**Read/Write Splitting u Aplikaciji:**
```typescript
// Prisma read replicas
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")      // Write
  directUrl = env("DATABASE_READ_URL") // Read replica
}
```

**Prioritet**: 🟡 Srednji  
**Effort**: 2-3 dana  
**Impact**: Srednji-Visok za read-heavy workloads

---

## 6. 💾 Backup & Disaster Recovery

### 6.1 Automated Backup Strategy

**Trenutno Stanje:**
- ⚠️ Nema automated backup
- ⚠️ Nema backup retention policy
- ⚠️ Nema testiranja restore procesa

**Predlog:**
```yaml
services:
  postgres-backup:
    image: postgres:16-alpine
    volumes:
      - ./backups:/backups
      - ./scripts/backup.sh:/backup.sh
    environment:
      PGHOST: postgres
      PGDATABASE: collector_db
      PGUSER: collector_user
      PGPASSWORD: ${POSTGRES_PASSWORD}
    command: >
      sh -c "
        while true; do
          pg_dump -Fc > /backups/collector_db_$(date +%Y%m%d_%H%M%S).dump
          # Retain only last 7 days
          find /backups -name '*.dump' -mtime +7 -delete
          sleep 86400  # Daily backup
        done
      "
  
  redis-backup:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
      - ./backups:/backups
    command: >
      sh -c "
        while true; do
          redis-cli --rdb /backups/redis_$(date +%Y%m%d_%H%M%S).rdb
          find /backups -name 'redis_*.rdb' -mtime +7 -delete
          sleep 86400
        done
      "
```

**Cloud Backup Integration:**
- AWS S3 / Google Cloud Storage / Azure Blob
- Encrypted backups
- Cross-region replication

**Prioritet**: 🟡 Srednji  
**Effort**: 2-3 dana  
**Impact**: Srednji-Visok

---

### 6.2 Disaster Recovery Plan

**Komponente DR Plan-a:**
1. **RPO (Recovery Point Objective)**: 1 sat - maksimalni gubitak podataka
2. **RTO (Recovery Time Objective)**: 4 sata - vreme do full recovery
3. **Backup Testing**: Mesečno testiranje restore procesa
4. **Failover Procedure**: Dokumentovan proces
5. **Communication Plan**: Alerting i notification plan

**Prioritet**: 🟡 Srednji  
**Effort**: 5-7 dana (planiranje + implementacija)  
**Impact**: Visok u slučaju katastrofe

---

## 7. 🔧 Operational Improvements

### 7.1 Health Checks Enhancement

**Trenutno Stanje:**
- ✅ Osnovni health checks
- ⚠️ Nema readiness vs liveness probe razlike
- ⚠️ Nema dependency health checks

**Predlog:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 40s

# Separate readiness check
readiness:
  test: ["CMD", "curl", "-f", "http://localhost:3000/ready"]
```

**Health Check Endpoints:**
```typescript
// Health check sa dependency checks
app.get('/health', async (req, res) => {
  const checks = {
    service: 'healthy',
    database: await checkDatabase(),
    redis: await checkRedis(),
    rabbitmq: await checkRabbitMQ()
  };
  
  const allHealthy = Object.values(checks).every(v => v === 'healthy');
  res.status(allHealthy ? 200 : 503).json(checks);
});
```

**Prioritet**: 🟢 Nizak  
**Effort**: 1 dan  
**Impact**: Srednji

---

### 7.2 Graceful Shutdown

**Trenutno Stanje:**
- ⚠️ Nema graceful shutdown
- ⚠️ Connections se mogu prekinuti usred request-a

**Predlog:**
```typescript
// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Stop accepting new requests
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  // Wait for active requests to complete
  await waitForActiveRequests();
  
  // Close database connections
  await prisma.$disconnect();
  
  // Close Redis connection
  await redis.disconnect();
  
  // Close RabbitMQ connection
  await rabbitmq.disconnect();
  
  process.exit(0);
});
```

**Prioritet**: 🟡 Srednji  
**Effort**: 1 dan  
**Impact**: Srednji

---

### 7.3 Configuration Management

**Trenutno Stanje:**
- ⚠️ Configuration razbacana u više fajlova
- ⚠️ Nema environment-specific konfiguracija

**Predlog:**
```typescript
// Centralized config
export const config = {
  env: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
    }
  },
  redis: {
    url: process.env.REDIS_URL,
    ttl: parseInt(process.env.REDIS_TTL || '3600'),
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL,
    exchange: process.env.RABBITMQ_EXCHANGE || 'collector.events',
  },
  // Feature flags
  features: {
    enableCache: process.env.ENABLE_CACHE === 'true',
    enableTracing: process.env.ENABLE_TRACING === 'true',
  }
};
```

**Prioritet**: 🟢 Nizak  
**Effort**: 1-2 dana  
**Impact**: Srednji

---

## 8. 📋 Implementation Roadmap

### Faza 1: Critical Security (Nedelja 1-2)
1. ✅ Secrets management (Docker Secrets)
2. ✅ SSL/TLS certificates
3. ✅ Network segmentation
4. ✅ JWT authentication u Kong-u

**Effort**: 5-7 dana  
**Impact**: 🔴 Visok

---

### Faza 2: High Availability (Nedelja 3-4)
1. ✅ Redis Sentinel
2. ✅ RabbitMQ Clustering
3. ✅ Kong HA (2+ instances)
4. ✅ HAProxy load balancing improvements

**Effort**: 7-10 dana  
**Impact**: 🔴 Visok

---

### Faza 3: Monitoring & Observability (Nedelja 5-6)
1. ✅ Prometheus + Grafana setup
2. ✅ Basic dashboards
3. ✅ Alerting rules
4. ✅ ELK stack za logging

**Effort**: 5-7 dana  
**Impact**: 🟡 Srednji-Visok

---

### Faza 4: Performance & Scalability (Nedelja 7-8)
1. ✅ Database connection pooling
2. ✅ Read replicas setup
3. ✅ Horizontal scaling strategy
4. ✅ Performance tuning

**Effort**: 5-7 dana  
**Impact**: 🟡 Srednji

---

### Faza 5: Backup & DR (Nedelja 8-9)
1. ✅ Automated backups
2. ✅ DR plan dokumentacija
3. ✅ Backup testing procedure
4. ✅ Cloud backup integration

**Effort**: 3-5 dana  
**Impact**: 🟡 Srednji

---

## 9. 💰 Cost Estimation

### Development Environment
- Trenutno: ~$0 (local Docker)
- Posle izmena: ~$0

### Production Environment (Cloud)
- **Minimum (Single Region)**:
  - Compute: $200-300/mesec
  - Database: $100-150/mesec
  - Cache (Redis): $50-100/mesec
  - Monitoring: $50-100/mesec
  - **Total: ~$400-650/mesec**

- **Recommended (HA Setup)**:
  - Compute: $400-600/mesec
  - Database (HA): $200-300/mesec
  - Cache (HA): $100-200/mesec
  - Monitoring: $100-150/mesec
  - Backup Storage: $50-100/mesec
  - **Total: ~$850-1350/mesec**

---

## 10. ✅ Quick Wins (Može se uraditi odmah)

1. **Docker Secrets** - 2 sata
2. **Enhanced Health Checks** - 4 sata
3. **Basic Prometheus Metrics** - 1 dan
4. **Redis Connection Pooling** - 4 sata
5. **Graceful Shutdown** - 4 sata
6. **Configuration Management** - 1 dan

**Total Effort**: ~3-4 dana  
**Total Impact**: Srednji-Visok

---

## 11. 📊 Success Metrics

### Security
- ✅ Zero hardcoded secrets
- ✅ 100% HTTPS traffic
- ✅ Network segmentation implemented

### Availability
- ✅ 99.9% uptime (8.76 hours downtime/year)
- ✅ Automatic failover < 30 seconds
- ✅ Zero single points of failure

### Performance
- ✅ P95 latency < 200ms
- ✅ 99th percentile latency < 500ms
- ✅ Database query time < 100ms (p95)

### Observability
- ✅ 100% of requests traced
- ✅ < 5 minute alerting time
- ✅ All metrics collected

---

## 📝 Conclusion

Predložene izmene će značajno poboljšati:
- **Sigurnost** - Zero-trust architecture
- **Pouzdanost** - High availability setup
- **Vidljivost** - Complete observability
- **Performanse** - Optimizovana infrastruktura
- **Skalabilnost** - Ready za rast

**Prioritet za sledećih 30 dana:**
1. Security improvements (Faza 1)
2. High Availability (Faza 2)
3. Monitoring setup (Faza 3)

---

*Dokument kreiran: $(date)*  
*Poslednje ažuriranje: $(date)*

