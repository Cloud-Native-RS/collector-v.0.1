# Collector Platform - Microservices

This directory contains the microservices that power the Collector platform.

## Available Services

### Registry Service

**Purpose**: Central registry of customers and legal entities

**Status**: ✅ Production Ready

**Features**:
- Customer and company master data management
- Tax ID and registration validation
- Multi-tenant isolation
- RESTful API with OpenAPI documentation
- Docker ready with compose configuration

**Quick Start**: See [registry-service/QUICK_START.md](registry-service/QUICK_START.md)

**Documentation**: [registry-service/README.md](registry-service/README.md)

### Future Services

The following microservices are planned:

- **Billing Service** - Invoice and payment management
- **Inventory Service** - Product and stock management  
- **Sales Service** - Sales orders and offers
- **Accounting Service** - General ledger and financial reporting
- **Document Service** - Document storage and management
- **Notification Service** - Email, SMS, and push notifications

## Architecture Overview

The Collector platform follows a microservices architecture where each service:

- Maintains its own database
- Exposes a RESTful API
- Is independently deployable
- Communicates via HTTP/REST or message queues
- Shares common authentication and authorization

### Service Communication

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     API      │────▶│   Registry   │     │   Billing    │
│   Gateway    │     │   Service    │     │   Service    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    ▼                    ▼
       └─────────────────┬──────────────┬──────────────┐
                         │              │              │
                    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
                    │PostgreSQL│   │PostgreSQL│   │PostgreSQL│
                    └─────────┘    └─────────┘    └─────────┘
```

## Development Setup

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- PostgreSQL 16+ (or use Docker)

### Common Commands

**Start a service:**
```bash
cd services/<service-name>
docker-compose up -d
```

**Run migrations:**
```bash
cd services/<service-name>
docker-compose exec <service> npm run db:migrate
```

**View logs:**
```bash
cd services/<service-name>
docker-compose logs -f
```

**Stop a service:**
```bash
cd services/<service-name>
docker-compose down
```

## Service Communication

Services communicate via:

1. **REST APIs** - Synchronous communication
2. **Message Queue** (Future) - Asynchronous communication
3. **Shared Events** (Future) - Event-driven architecture

## Authentication

All services share a common authentication mechanism:

- JWT tokens issued by the API Gateway
- Token includes user ID and tenant ID
- Each service validates the token independently

## Data Consistency

### Saga Pattern (Future)

For distributed transactions across services, we'll use the Saga pattern:

- Each step in the saga is a local transaction in one service
- If any step fails, compensating transactions roll back previous steps

### Eventual Consistency

Services maintain eventual consistency through:
- Event publishing
- Event handlers
- Retry mechanisms

## Testing

Each service has its own test suite:

```bash
cd services/<service-name>
npm test
```

Integration tests run across services (future):

```bash
npm run test:integration
```

## Deployment

### Local Development

Use Docker Compose for local development and testing.

### Staging/Production

Services are deployed as:
- Docker containers in Kubernetes
- Or managed cloud services (AWS ECS, GCP Cloud Run, etc.)

Each service has its own deployment configuration.

## Monitoring & Observability

### Logs

Each service logs to stdout, collected by the logging infrastructure.

### Metrics

Services expose Prometheus metrics at `/metrics` endpoint.

### Tracing

Distributed tracing with OpenTelemetry (future).

### Health Checks

Each service exposes a `/health` endpoint.

## Security

### Network Security

- Services communicate over private networks
- External access only through API Gateway
- SSL/TLS encryption in transit

### Data Security

- Database encryption at rest
- Sensitive fields encrypted in application
- Audit logging for data changes

### Access Control

- Role-based access control (RBAC)
- API keys for service-to-service communication
- Rate limiting on public endpoints

## Contributing

When adding a new microservice:

1. Follow the existing service structure
2. Include Docker and Docker Compose setup
3. Add comprehensive documentation
4. Implement health checks and monitoring
5. Include API documentation (OpenAPI/Swagger)
6. Add tests (unit and integration)

## Getting Help

- Documentation: See each service's README
- Issues: GitHub Issues
- Support: support@collector.com

## License

Proprietary - Collector Platform

