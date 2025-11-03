# Collector Platform v.0.1

Kompletan CRM i ERP sistem sa mikroservisnom arhitekturom, multi-tenant podrškom i modernim Next.js frontend-om.

## 📋 Pregled

Collector je enterprise platforma koja kombinuje CRM (Customer Relationship Management), ERP (Enterprise Resource Planning) i inventory management funkcionalnosti u jednu integrisanu aplikaciju. Platforma je dizajnirana sa fokusom na skalabilnost, modularnost i nezavisnost servisa.

## 🏗️ Arhitektura

Projekat koristi **mikroservisnu arhitekturu** sa sledećim komponentama:

- **Frontend**: Next.js 16 sa React 19, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Node.js/Express mikroservisi sa TypeScript-om
- **Database**: PostgreSQL 17.2 (po jedan za svaki mikroservis)
- **Cache**: Redis 7.4.1
- **Message Queue**: RabbitMQ 3.13.4
- **API Gateway**: Kong API Gateway (u planu)
- **Containerization**: Docker & Docker Compose

## 🔧 Mikroservisi

| Servis | Port | Opis | Status |
|--------|------|------|--------|
| **Account Registry** | 3001 | Centralni registar kupaca i kompanija | ✅ Production Ready |
| **Orders** | 3002 | Upravljanje narudžbinama | ✅ Production Ready |
| **Invoices** | 3003 | Fakture i plaćanja | ✅ Production Ready |
| **Offers** | 3004 | Ponude i cenovnici | ✅ Production Ready |
| **Inventory** | 3005 | Upravljanje proizvodima i zalihama | ✅ Production Ready |
| **HR** | 3006 | Upravljanje ljudskim resursima | ✅ Production Ready |
| **Projects** | 3007 | Projektni menadžment | ✅ Production Ready |
| **Delivery** | 3008 | Upravljanje dostavama | ✅ Production Ready |

## 🚀 Quick Start

### Preduslovi

- **Node.js** 20+ 
- **Docker** & **Docker Compose**
- **Git**

### Pokretanje celog sistema

Najbrži način da pokrenete sve servise:

```bash
# Kloniranje repozitorijuma
git clone https://github.com/Cloud-Native-RS/collector-v.0.1.git
cd collector-v.0.1

# Pokretanje svih servisa
./scripts/dev-start.sh

# Ili direktno sa docker-compose
docker compose up -d
```

### Verifikacija

```bash
# Provera statusa
docker compose ps

# Health check servisa
curl http://localhost:3001/health  # Registry Service
curl http://localhost:3002/health  # Orders Service
# ... itd
```

### Frontend Development

```bash
# Instalacija dependencija
npm install

# Pokretanje development servera
npm run dev

# Otvorite http://localhost:3000 u browseru
```

## 📦 Struktura Projekta

```
collector-v.0.1/
├── app/                          # Next.js aplikacija
│   ├── (app)/                   # Zaštićene rute (CRM, dashboard, itd.)
│   ├── (auth)/                  # Autentifikacione rute (login, signup)
│   ├── api/                     # Next.js API rute (proxy ka mikroservisima)
│   └── collector/               # Collector modul
├── components/                   # React komponente
│   ├── ui/                      # shadcn/ui komponente
│   ├── layout/                  # Layout komponente
│   └── auth/                    # Auth komponente
├── services/                     # Mikroservisi
│   ├── registry-service/        # Account Registry mikroservis
│   ├── orders-service/          # Orders mikroservis
│   ├── invoices-service/        # Invoices mikroservis
│   ├── offers-service/          # Offers mikroservis
│   ├── inventory-service/       # Inventory mikroservis
│   ├── hr-service/              # HR mikroservis
│   ├── project-management-service/ # Projects mikroservis
│   └── delivery-service/        # Delivery mikroservis
├── infrastructure/              # Infrastruktura konfiguracije
│   ├── kong/                    # Kong API Gateway
│   ├── envoy/                   # Envoy Proxy
│   ├── haproxy/                 # HAProxy
│   ├── rabbitmq/                # RabbitMQ konfiguracija
│   └── redis/                   # Redis konfiguracija
├── scripts/                     # Utility skripte
│   ├── dev-start.sh            # Pokretanje svih servisa
│   ├── seed-all.sh             # Seeding baza podataka
│   └── ...
└── docs/                        # Dokumentacija
```

## 🔐 Autentifikacija i Multi-Tenancy

Platforma podržava:
- **JWT-based autentifikaciju** za sve servise
- **Multi-tenant izolaciju** podataka
- **Role-based access control (RBAC)**
- Integrisan auth sistem sa Next.js middleware-om

Za više detalja o autentifikaciji, pogledajte [AUTH_SETUP.md](./AUTH_SETUP.md).

## 🗄️ Baze Podataka

Svaki mikroservis ima svoju PostgreSQL bazu:

```bash
# Connection string format
postgresql://collector:collector_dev_pass@localhost:5432/collector_<service>_db
```

| Database | Description |
|----------|-------------|
| `collector_account_registry_db` | Kupci i kompanije |
| `collector_orders_db` | Narudžbine |
| `collector_invoices_db` | Fakture |
| `collector_offers_db` | Ponude |
| `collector_inventory_db` | Proizvodi i zalihe |
| `collector_hr_db` | Zaposleni |
| `collector_projects_db` | Projekti |
| `collector_delivery_db` | Dostave |

### Seeding Baza Podataka

```bash
# Seed svih baza
npm run seed:all

# Ili pojedinačno
npm run seed:registry
npm run seed:orders
npm run seed:inventory
# ... itd
```

## 🧪 Testing

```bash
# Pokretanje svih testova
npm test

# Test sa coverage
npm run test:coverage

# Test pojedinačnog servisa
npm run test:registry
npm run test:invoices
npm run test:delivery

# Watch mode
npm run test:watch

# UI mode
npm run test:ui
```

## 🛠️ Development

### Pokretanje pojedinačnog servisa

```bash
cd services/<service-name>
npm install
npm run dev
```

### Database Migrations

```bash
cd services/<service-name>
npx prisma migrate dev
npx prisma generate
```

### API Dokumentacija

Većina servisa ima Swagger/OpenAPI dokumentaciju dostupnu na:
- Registry Service: `http://localhost:3001/api-docs`
- Orders Service: `http://localhost:3002/api-docs`
- ... itd

## 📚 Dokumentacija

- [Quick Start Guide](./QUICK_START.md) - Brzi vodič za početak
- [Architecture Documentation](./docs/ARCHITECTURE.md) - Arhitektura sistema
- [Microservices Summary](./MICROSERVICE_SUMMARY.md) - Detalji o mikroservisima
- [Infrastructure Summary](./INFRASTRUCTURE_SUMMARY.md) - Infrastruktura
- [Auth Setup](./AUTH_SETUP.md) - Autentifikacija setup
- [Environment Setup](./ENV_SETUP.md) - Konfiguracija okruženja
- [Docker README](./README_DOCKER.md) - Docker setup
- [Services README](./README_SERVICES.md) - Detalji o servisima
- [Tenant System](./TENANT_SISTEM.md) - Multi-tenancy sistem

## 🐳 Docker

### Pokretanje sa Docker Compose

```bash
# Pokretanje svih servisa
docker compose up -d

# Pregled logova
docker compose logs -f

# Zaustavljanje
docker compose down

# Zaustavljanje sa brisanjem volumena
docker compose down -v
```

### Docker Credentials

**PostgreSQL:**
- User: `collector`
- Password: `collector_dev_pass`
- Port: `5432`

**Redis:**
- Password: `collector_redis_pass`
- Port: `6379`

**RabbitMQ:**
- User: `collector`
- Password: `collector_rabbitmq_pass`
- Management UI: http://localhost:15672

## 🚢 Deployment

### OpenShift/Kubernetes

Za deployment na OpenShift, pogledajte:
- [OpenShift Deployment Plan](./OPENSHIFT_DEPLOYMENT_PLAN.md)
- [OpenShift Manifests](./openshift/)

### Produkcija

Svaki servis može biti deployed nezavisno:
- Docker kontejneri
- Kubernetes pods
- Cloud-native servisi (AWS ECS, GCP Cloud Run, Azure Container Instances)

## 🔍 Monitoring i Observability

- **Health Checks**: `/health` endpoint na svakom servisu
- **Metrics**: Prometheus metrics (u planu)
- **Logging**: Structured logging sa stdout
- **Tracing**: OpenTelemetry (u planu)

## 🛡️ Security

- JWT token autentifikacija
- HTTPS/TLS enkripcija
- Multi-tenant data isolation
- Input validation i sanitization
- Rate limiting (u planu)
- CORS konfiguracija

## 📝 Scripts

Dostupne npm skripte:

```bash
# Development
npm run dev              # Pokretanje Next.js dev servera
npm run build            # Build produkcijske verzije
npm run start            # Pokretanje produkcijskog servera

# Testing
npm test                 # Pokretanje testova
npm run test:coverage    # Test sa coverage reportom
npm run test:watch       # Watch mode

# Seeding
npm run seed:all         # Seed svih baza podataka
npm run seed:registry    # Seed registry baze
# ... (vidi package.json za sve opcije)

# Services
npm run test:services    # Test svih mikroservisa
```

## 🤝 Contributing

1. Fork repozitorijum
2. Kreirajte feature branch (`git checkout -b feature/amazing-feature`)
3. Commit izmene (`git commit -m 'Add amazing feature'`)
4. Push na branch (`git push origin feature/amazing-feature`)
5. Otvorite Pull Request

## 📄 License

Proprietary - Collector Platform

## 👥 Kontakt i Podrška

- **Repository**: https://github.com/Cloud-Native-RS/collector-v.0.1
- **Organizacija**: Cloud-Native-RS

## 🎯 Roadmap

- [ ] API Gateway integracija (Kong)
- [ ] Event-driven arhitektura sa RabbitMQ
- [ ] Prometheus metrics i Grafana dashboards
- [ ] OpenTelemetry distributed tracing
- [ ] CI/CD pipeline
- [ ] Production deployment guide
- [ ] Performance optimization
- [ ] Additional mikroservisi (Notifications, Documents, Analytics)

---

**Napomena**: Ovaj projekat je u aktivnom razvoju. Za najnovije informacije, proverite dokumentaciju u `docs/` direktorijumu.
