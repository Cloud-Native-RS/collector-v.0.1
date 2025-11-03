# 🔍 Duboka Analiza Mikroservisa - Docker & OpenShift Deployment

## 📊 Pregled Mikroservisa

### Port Konfiguracija

| Servis | Port (Kod) | Port (Dockerfile) | Status | Problemi |
|--------|------------|-------------------|--------|----------|
| registry-service | 3001 | 3001 | ✅ OK | - |
| orders-service | 3001 | 3002 | ❌ KONFLIKT | Port u kodu ne odgovara Dockerfile-u |
| offers-service | 3003 | 3002 | ❌ KONFLIKT | Port u kodu ne odgovara Dockerfile-u |
| invoices-service | 3002 | 3002 | ✅ OK | - |
| delivery-service | 3002 | 3002 | ⚠️ KONFLIKT | Deli port sa invoices i inventory |
| inventory-service | 3002 | 3002 | ⚠️ KONFLIKT | Deli port sa invoices i delivery |
| hr-service | 3006 | 3006 | ✅ OK | - |
| project-management-service | 3006 | 3006 | ⚠️ KONFLIKT | Deli port sa hr-service |

### Preporučeni Portovi (Bez Konflikata)

| Servis | Novi Port | Razlog |
|--------|-----------|--------|
| registry-service | 3001 | Zadržati |
| orders-service | 3002 | Popraviti u kodu |
| offers-service | 3003 | Zadržati u kodu, popraviti Dockerfile |
| invoices-service | 3004 | Promeniti u kodu i Dockerfile |
| delivery-service | 3005 | Promeniti u kodu i Dockerfile |
| inventory-service | 3006 | Promeniti u kodu i Dockerfile |
| hr-service | 3007 | Promeniti u kodu i Dockerfile |
| project-management-service | 3008 | Promeniti u kodu i Dockerfile |

---

## 🔧 Problemi u Dockerfile-ovima

### 1. **Nedostaje Non-Root User za OpenShift**
- OpenShift zahteva da kontejneri ne rade kao root
- Trenutno: Svi Dockerfile-ovi koriste root korisnika
- Potrebno: Kreirati non-root korisnika i koristiti ga

### 2. **Nedostaju Health Checks**
- Neki servisi nemaju proper health check endpoint-e
- OpenShift koristi health checks za liveness i readiness probes

### 3. **Nedostaju .dockerignore Fajlovi**
- Samo registry-service ima .dockerignore
- Ostali servisi kopiraju nepotrebne fajlove (node_modules, .git, itd.)

### 4. **Neoptimizovane Build Stage-ovi**
- Neki Dockerfile-ovi koriste `npm install` umesto `npm ci`
- Nedostaju build cache optimizacije
- Preveliki production image-ovi

### 5. **Nedostaju Environment Variable Validacije**
- Nema provere obaveznih env varijabli na startu
- Može dovesti do runtime grešaka

---

## 🚀 OpenShift Specifični Zahtevi

### 1. **Security Context Constraints (SCC)**
- OpenShift ograničava root pristup
- Potrebno: Non-root user sa dozvoljenim ID range-om

### 2. **Resource Limits**
- OpenShift zahteva definisane resource limits i requests
- CPU: 100m - 500m (request), 500m - 2000m (limit)
- Memory: 256Mi - 512Mi (request), 512Mi - 2Gi (limit)

### 3. **Readiness & Liveness Probes**
- Readiness: Provera da li servis spreman za zahteve
- Liveness: Provera da li servis živi
- Endpoint: `/health` sa proper response

### 4. **Service Accounts & RBAC**
- OpenShift koristi Service Accounts za autorizaciju
- Potrebno definisati Role i RoleBinding za inter-service komunikaciju

### 5. **ConfigMaps i Secrets**
- Environment varijable treba da budu u ConfigMaps
- Sensitive podaci (passwords, tokens) u Secrets
- Ne hardkodirati u Deployment manifeste

### 6. **Persistent Volumes**
- Database podaci trebaju Persistent Volumes
- OpenShift podržava: NFS, Ceph, AWS EBS, itd.

### 7. **Routes (Ingress)**
- OpenShift Routes su ekvivalent Kubernetes Ingress-a
- Potrebno kreirati Routes za svaki javni servis
- TLS/SSL konfiguracija preko OpenShift Certificates

### 8. **Image Streams**
- OpenShift koristi Image Streams umesto direktnih image referenci
- BuildConfig automatski kreira Image Streams

### 9. **BuildConfig za CI/CD**
- Source-to-Image (S2I) ili Docker builds
- GitHub/GitLab webhook integracija
- Automatski build na push

---

## 📦 Zavisnosti Između Servisa

### Database Servisi
- **PostgreSQL**: Svaki servis ima svoj database instance
- **Redis**: Shared cache layer
- **RabbitMQ**: Shared message broker

### Inter-Service Komunikacija
```
registry-service → orders-service (customer data)
offers-service → orders-service (offer approval events)
orders-service → inventory-service (stock check)
orders-service → delivery-service (create delivery note)
orders-service → invoices-service (generate invoice)
inventory-service → delivery-service (sync stock)
```

---

## 🐛 Identifikovani Bug-ovi

### 1. **Port Konflikti**
- orders-service: Kod koristi 3001, Dockerfile 3002
- offers-service: Kod koristi 3003, Dockerfile 3002
- delivery/inventory/invoices: Svi koriste 3002
- hr/project-management: Oba koriste 3006

### 2. **Nedostaju .dockerignore**
- offers-service
- inventory-service
- delivery-service
- hr-service
- project-management-service
- invoices-service
- orders-service

### 3. **Inconsistent Dockerfile Struktura**
- project-management-service koristi drugačiju strukturu
- Neki koriste `npm ci`, neki `npm install`
- Različite Node.js verzije (svi koriste 20-alpine, ali mogu biti optimizovani)

### 4. **Nedostaju Environment Variable Defaults**
- Neki servisi nemaju default vrednosti
- Mogu pasti na startu ako env varijable nisu postavljene

---

## ✅ Plan Akcije

### Faza 1: Popravka Docker Konfiguracija
1. ✅ Popravi portove u kodovima i Dockerfile-ovima
2. ✅ Dodaj .dockerignore fajlove za sve servise
3. ✅ Optimizuj Dockerfile-ove (non-root user, multi-stage builds)
4. ✅ Dodaj proper health check endpoint-e
5. ✅ Testiraj sve Docker build-ove lokalno

### Faza 2: OpenShift Manifesti
1. ✅ Kreiraj Deployment manifeste za sve servise
2. ✅ Kreiraj Service manifeste
3. ✅ Kreiraj Route manifeste za javne servise
4. ✅ Kreiraj ConfigMap manifeste za env varijable
5. ✅ Kreiraj Secret manifeste za sensitive podatke
6. ✅ Kreiraj PersistentVolumeClaim za databases
7. ✅ Kreiraj BuildConfig za CI/CD

### Faza 3: Dokumentacija
1. ✅ OpenShift deployment guide
2. ✅ Environment variables dokumentacija
3. ✅ Troubleshooting guide
4. ✅ CI/CD pipeline setup

---

## 📋 Checklist za OpenShift Deployment

### Pre-Deployment
- [ ] Svi Dockerfile-ovi koriste non-root user
- [ ] Svi servisi imaju .dockerignore
- [ ] Health check endpoint-e rade
- [ ] Portovi su usklađeni
- [ ] Environment varijable su dokumentovane

### OpenShift Setup
- [ ] Namespace kreiran
- [ ] Service Accounts kreirani
- [ ] RBAC Role i RoleBinding definisani
- [ ] Image Pull Secrets konfigurirani (ako koristi private registry)

### Resource Deployment
- [ ] Secrets kreirani (database passwords, JWT secrets)
- [ ] ConfigMaps kreirani (non-sensitive config)
- [ ] PersistentVolumeClaims kreirani za databases
- [ ] Services kreirani za sve servise
- [ ] Deployments kreirani sa proper resource limits
- [ ] Routes kreirani za javne servise
- [ ] BuildConfig kreiran za CI/CD

### Post-Deployment
- [ ] Health checks rade
- [ ] Inter-service komunikacija funkcioniše
- [ ] Database migracije izvršene
- [ ] Logovi se prikupljaju
- [ ] Monitoring setup

---

## 🔐 Security Considerations

### OpenShift Best Practices
1. **Non-root User**: Svi kontejneri moraju raditi kao non-root
2. **Read-only Root Filesystem**: Gde je moguće
3. **Drop Capabilities**: Koristiti minimalne Linux capabilities
4. **Network Policies**: Ograničiti network pristup između servisa
5. **Resource Quotas**: Ograničiti resurse po namespace-u
6. **Image Scanning**: Skenirati Docker image-e za vulnerabilnosti
7. **Secrets Management**: Koristiti OpenShift Secrets, ne hardkodirati

---

## 📊 Resource Allocation (Preporučeno)

| Servis | CPU Request | CPU Limit | Memory Request | Memory Limit |
|--------|-------------|-----------|----------------|--------------|
| registry-service | 100m | 500m | 256Mi | 512Mi |
| orders-service | 200m | 1000m | 512Mi | 1Gi |
| offers-service | 100m | 500m | 256Mi | 512Mi |
| invoices-service | 200m | 1000m | 512Mi | 1Gi |
| delivery-service | 100m | 500m | 256Mi | 512Mi |
| inventory-service | 200m | 1000m | 512Mi | 1Gi |
| hr-service | 100m | 500m | 256Mi | 512Mi |
| project-management-service | 100m | 500m | 256Mi | 512Mi |

---

## 🔄 CI/CD Pipeline Preporuke

### Build Stage
1. **Source Code Checkout**: Git clone repository
2. **Linting**: ESLint/TypeScript checks
3. **Testing**: Unit tests
4. **Docker Build**: Build container image
5. **Image Push**: Push to OpenShift Image Registry

### Deploy Stage
1. **Deploy to Dev**: Automatski deploy na push u develop branch
2. **Deploy to Staging**: Automatski deploy na push u release branch
3. **Deploy to Production**: Manual approval required

### Rollback Strategy
- OpenShift Deployment History
- Quick rollback na prethodnu verziju
- Database migration rollback scripts

---

*Dokument kreiran: $(date)*
*Status: U radu*

