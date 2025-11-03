# OpenShift Deployment Guide - Collector Platform

## 📋 Pregled

Ovaj direktorijum sadrži sve OpenShift manifeste potrebne za deployment Collector platforme na OpenShift klaster.

## 📁 Struktura

```
openshift/
├── README.md (ovaj fajl)
├── base/                      # Bazni manifesti (Namespace, Secrets, ConfigMaps)
│   ├── namespace.yaml
│   ├── secrets.yaml
│   └── configmaps.yaml
├── services/                  # Servis-specifični manifesti
│   ├── registry-service/
│   ├── orders-service/
│   ├── offers-service/
│   ├── invoices-service/
│   ├── delivery-service/
│   ├── inventory-service/
│   ├── hr-service/
│   └── project-management-service/
└── infrastructure/            # Infrastrukturni servisi
    ├── postgres/
    ├── redis/
    └── rabbitmq/
```

## 🚀 Quick Start

### 1. Login na OpenShift

```bash
oc login https://your-openshift-cluster:8443
oc project collector-platform  # ili kreirajte novi projekat
```

### 2. Kreiraj Namespace i Base Resurse

```bash
oc apply -f base/namespace.yaml
oc apply -f base/secrets.yaml
oc apply -f base/configmaps.yaml
```

### 3. Deploy Infrastrukture

```bash
# PostgreSQL baze
oc apply -f infrastructure/postgres/

# Redis
oc apply -f infrastructure/redis/

# RabbitMQ
oc apply -f infrastructure/rabbitmq/
```

### 4. Deploy Mikroservisa

```bash
# Svi servisi odjednom
oc apply -f services/ -R

# Ili pojedinačno
oc apply -f services/registry-service/
oc apply -f services/orders-service/
# ... itd.
```

### 5. Deploy Routes (Expose Services)

```bash
oc apply -f services/*/route.yaml
```

## 🔧 Konfiguracija

### Environment Variables

Environment varijable su definisane u:
- **ConfigMaps**: Non-sensitive konfiguracija
- **Secrets**: Sensitive podaci (passwords, tokens)

### Promena Konfiguracije

```bash
# Ažuriraj ConfigMap
oc edit configmap collector-config

# Ažuriraj Secret
oc edit secret collector-secrets

# Restartuj pod-ove da primene promene
oc rollout restart deployment/registry-service
```

## 📊 Monitoring

### Logovi

```bash
# Svi pod-ovi
oc logs -f -l app=registry-service

# Specifičan pod
oc logs -f <pod-name>
```

### Status

```bash
# Status deployment-a
oc status

# Pod status
oc get pods

# Service status
oc get svc

# Route status
oc get routes
```

## 🔄 CI/CD Integration

BuildConfig manifesti su kreirani za Source-to-Image (S2I) builds.

### Manual Build

```bash
oc start-build registry-service-build
```

### Automated Build (GitHub Webhook)

1. Kreiraj webhook u GitHub repository-ju
2. Poveži sa BuildConfig (oc describe bc registry-service-build)
3. Svaki push će trigger-ovati build

## 🔐 Security

### Service Accounts

Svaki servis koristi dedicated Service Account sa minimalnim dozvolama.

### RBAC

Role i RoleBinding su definisani za inter-service komunikaciju.

### Image Pull Secrets

Ako koristite private Docker registry, dodajte Image Pull Secrets:

```bash
oc create secret docker-registry registry-secret \
  --docker-server=<registry-url> \
  --docker-username=<username> \
  --docker-password=<password>

oc secrets link default registry-secret --for=pull
```

## 📝 Notes

- **Portovi**: Svi portovi su usklađeni i bez konflikata
- **Non-root**: Svi kontejneri rade kao non-root user
- **Health Checks**: Svi servisi imaju liveness i readiness probes
- **Resource Limits**: Resursi su definisani za svaki servis
- **Persistent Volumes**: Database podaci koriste PersistentVolumeClaims

## 🐛 Troubleshooting

### Pod ne startuje

```bash
# Proveri events
oc get events --sort-by='.lastTimestamp'

# Proveri pod logs
oc logs <pod-name>

# Proveri pod status
oc describe pod <pod-name>
```

### Image Pull Errors

```bash
# Proveri Image Pull Secrets
oc get secrets

# Proveri Image Stream
oc describe is registry-service
```

### Database Connection Issues

```bash
# Proveri database pod
oc get pods -l app=postgres

# Proveri database service
oc get svc postgres

# Test connection
oc exec -it <pod-name> -- psql -U <user> -d <database>
```

## 📚 Dodatna Dokumentacija

- [OpenShift Documentation](https://docs.openshift.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

