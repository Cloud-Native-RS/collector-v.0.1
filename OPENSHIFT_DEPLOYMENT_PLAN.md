# 🚀 OpenShift Deployment Plan - Collector Platform

## 📋 Izvršni Sažetak

Ovaj dokument sadrži kompletan plan za deployment Collector mikroservisa na OpenShift platformu. Svi Dockerfile-ovi su optimizovani, portovi usklađeni, i OpenShift manifesti kreirani.

---

## ✅ Završeni Zadaci

### 1. Dockerfile Optimizacije
- ✅ Dodat non-root user (nodejs:1001) za sve servise
- ✅ Optimizovane multi-stage builds
- ✅ Dodati health checks u sve Dockerfile-ove
- ✅ Popravljeni portovi da budu bez konflikata
- ✅ Dodati .dockerignore fajlovi za sve servise
- ✅ Optimizovane npm install komande (npm ci, cache clean)

### 2. Port Konfiguracija

| Servis | Port | Status |
|--------|------|--------|
| registry-service | 3001 | ✅ OK |
| orders-service | 3002 | ✅ Popravljen |
| offers-service | 3003 | ✅ OK |
| invoices-service | 3004 | ✅ Popravljen |
| delivery-service | 3005 | ✅ Popravljen |
| inventory-service | 3006 | ✅ Popravljen |
| hr-service | 3007 | ✅ Popravljen |
| project-management-service | 3008 | ✅ Popravljen |

### 3. OpenShift Manifesti
- ✅ Namespace manifest
- ✅ ConfigMap manifest
- ✅ Secrets manifest
- ✅ Deployment manifest (template za registry-service)
- ✅ Service manifest
- ✅ Route manifest
- ✅ BuildConfig manifest
- ✅ ServiceAccount i RBAC manifesti
- ✅ Generator skripta za ostale servise

---

## 📁 Struktura Fajlova

```
openshift/
├── README.md                          # Opšta dokumentacija
├── generate-manifests.sh             # Skripta za generisanje manifesta
├── base/
│   ├── namespace.yaml                # Namespace definicija
│   ├── configmaps.yaml              # Globalni ConfigMaps
│   └── secrets.yaml                 # Secrets template
└── services/
    ├── registry-service/            # Kompletni manifesti (template)
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   ├── route.yaml
    │   ├── buildconfig.yaml
    │   └── serviceaccount.yaml
    └── [ostali servisi...]          # Generisani na osnovu template-a
```

---

## 🔧 Pre-Deployment Checklist

### Lokalna Provera

- [ ] Testiraj Docker build za sve servise
  ```bash
  cd services/registry-service
  docker build -t registry-service:test .
  docker run -p 3001:3001 registry-service:test
  ```

- [ ] Proveri da li se kontejneri pokreću kao non-root
  ```bash
  docker exec <container> whoami  # Treba da vrati: nodejs
  ```

- [ ] Proveri health check endpoint-e
  ```bash
  curl http://localhost:3001/health
  ```

### OpenShift Priprema

- [ ] Install OpenShift CLI (`oc`)
- [ ] Login na OpenShift klaster
- [ ] Kreiraj projekat/namespace
- [ ] Proveri da li imaš dozvole za kreiranje resursa
- [ ] Podesi Image Pull Secrets (ako koristiš private registry)

---

## 🚀 Deployment Koraci

### Faza 1: Setup Base Resursa

```bash
# 1. Kreiraj namespace
oc apply -f openshift/base/namespace.yaml

# 2. Prebaci se na namespace
oc project collector-platform

# 3. Kreiraj Secrets (PRVO AŽURIRAJ PASSWORDS!)
# VAŽNO: Promeni sve passwords u secrets.yaml pre deployment-a!
oc apply -f openshift/base/secrets.yaml

# 4. Kreiraj ConfigMaps
oc apply -f openshift/base/configmaps.yaml
```

### Faza 2: Generiši Manifeste za Sve Servise

```bash
cd openshift
./generate-manifests.sh
```

### Faza 3: Ažuriraj BuildConfig

U svakom `buildconfig.yaml` fajlu, ažuriraj:
- Git repository URL
- Branch/ref (main, develop, itd.)
- GitHub webhook secret (ako koristiš)

### Faza 4: Deploy Infrastrukture

```bash
# PostgreSQL instances (po servisu)
# Napravi PersistentVolumeClaims pre deployment-a
oc apply -f openshift/infrastructure/postgres/

# Redis
oc apply -f openshift/infrastructure/redis/

# RabbitMQ
oc apply -f openshift/infrastructure/rabbitmq/
```

### Faza 5: Deploy Mikroservisa

```bash
# ServiceAccounts i RBAC prvo
oc apply -f openshift/services/*/serviceaccount.yaml

# Zatim Deployments
oc apply -f openshift/services/*/deployment.yaml

# Zatim Services
oc apply -f openshift/services/*/service.yaml

# Na kraju Routes (za javni pristup)
oc apply -f openshift/services/*/route.yaml
```

### Faza 6: Database Migracije

```bash
# Za svaki servis, pokreni migracije
oc exec -it deployment/registry-service -- npm run db:migrate:deploy
# ... ponovi za sve servise
```

### Faza 7: Build Images

```bash
# Build prvi put
oc start-build registry-service-build

# Proveri build status
oc get builds

# Proveri build logs
oc logs -f build/registry-service-build-1
```

---

## 🔐 Security Best Practices

### 1. Secrets Management

**NE COMMIT-UJ** stvarne passwords u git! Koristi:
- OpenShift Secrets
- External secrets management (Vault, AWS Secrets Manager)
- CI/CD pipeline secrets

### 2. Image Security

```bash
# Skeniraj image-e za vulnerabilnosti
oc adm image scan registry-service:latest

# Koristi signed images
oc image mirror --keep-manifest-list ...
```

### 3. Network Policies

Kreiraj NetworkPolicy manifeste da ograničiš komunikaciju:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: registry-service-policy
spec:
  podSelector:
    matchLabels:
      app: registry-service
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: collector-platform
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
```

---

## 📊 Monitoring i Logging

### Prometheus Metrics

Dodaj Prometheus annotations u Deployment:

```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "3001"
    prometheus.io/path: "/metrics"
```

### Centralizovano Logging

OpenShift koristi EFK stack (Elasticsearch, Fluentd, Kibana) za centralizovano logovanje.

```bash
# Pregled logova
oc logs -f deployment/registry-service

# Logovi iz svih pod-ova
oc logs -f -l app=registry-service
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to OpenShift

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Login to OpenShift
        uses: redhat-actions/oc-login@v1
        with:
          openshift_server_url: ${{ secrets.OPENSHIFT_SERVER }}
          openshift_token: ${{ secrets.OPENSHIFT_TOKEN }}
          
      - name: Build and Deploy
        run: |
          oc start-build registry-service-build
          oc rollout status deployment/registry-service
```

---

## 🐛 Troubleshooting

### Pod Status: CrashLoopBackOff

```bash
# Proveri logs
oc logs deployment/registry-service

# Proveri events
oc get events --sort-by='.lastTimestamp'

# Proveri pod description
oc describe pod <pod-name>
```

### Image Pull Errors

```bash
# Proveri Image Pull Secrets
oc get secrets

# Proveri da li image postoji
oc describe is registry-service

# Test pull lokalno
docker pull <image-url>
```

### Database Connection Issues

```bash
# Proveri da li je database pod running
oc get pods -l app=postgres

# Proveri database service
oc get svc postgres

# Test connection iz servisa
oc exec -it deployment/registry-service -- \
  node -e "console.log(process.env.DATABASE_URL)"
```

### Port Already in Use

```bash
# Proveri da li postoji konflikt
oc get svc --all-namespaces | grep 3001

# Promeni port u Service manifestu ako je potrebno
```

---

## 📈 Scaling

### Manual Scaling

```bash
oc scale deployment/registry-service --replicas=3
```

### Auto Scaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: registry-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: registry-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 🔄 Rollback Procedure

```bash
# Pregled deployment history
oc rollout history deployment/registry-service

# Rollback na prethodnu verziju
oc rollout undo deployment/registry-service

# Rollback na specifičnu reviziju
oc rollout undo deployment/registry-service --to-revision=2

# Proveri status
oc rollout status deployment/registry-service
```

---

## 📝 Notes

1. **Environment Variables**: Svi env varijable su definisane u ConfigMaps i Secrets
2. **Database URLs**: Kreiraj Secrets za DATABASE_URL po servisu sa formatom:
   ```
   postgresql://user:password@postgres-service:5432/database?schema=public
   ```
3. **Resource Limits**: Prilagodi resource limits prema stvarnim potrebama
4. **Replicas**: Počni sa 2 replicas po servisu, skaliraj prema potrebi
5. **Health Checks**: Svi servisi imaju /health endpoint sa proper response

---

## 🎯 Next Steps

1. **Test Deployment**: Deploy na dev/staging okruženje prvo
2. **Load Testing**: Testiraj performanse pod opterećenjem
3. **Monitoring Setup**: Postavi Prometheus i Grafana za monitoring
4. **Alerting**: Konfiguriši alerts za kritične metrike
5. **Backup Strategy**: Postavi backup procedure za databases
6. **Disaster Recovery**: Dokumentuj disaster recovery plan

---

*Dokument kreiran: $(date)*
*Status: ✅ Spreman za deployment*

