# Customer & Company Registry Microservice

Production-ready microservice that serves as a central registry of all customers and legal entities within a multi-tenant system.

## Overview

The Registry Service is the central authority for customer and company master data across the Collector platform. It ensures data consistency, validation, and secure API access for integration with other services (CRM, ERP, Billing, etc.).

## Features

### Core Capabilities
- ✅ **Customer & Company Master Data Management** - Centralized storage and management
- ✅ **Tax ID & Registration Validation** - Multi-country validation support
- ✅ **Address & Contact Management** - Comprehensive contact information
- ✅ **Bank Account Storage** - Secure storage with encryption support
- ✅ **Multi-Tenant Isolation** - Complete data segregation per tenant
- ✅ **Duplicate Prevention** - Automated duplicate detection by tax ID, email, registration number
- ✅ **Lookup APIs** - Fast lookup by tax ID, email, registration number
- ✅ **RESTful API** - Complete CRUD operations
- ✅ **OpenAPI Documentation** - Swagger/OpenAPI specification
- ✅ **Input Validation** - Zod schemas for request validation
- ✅ **Error Handling** - Consistent error responses
- ✅ **Tenant Isolation** - Middleware-based multi-tenancy

## Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI
- **Testing**: Vitest

## Project Structure

```
services/registry-service/
├── src/
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware (auth, tenant, error handling)
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic layer
│   ├── utils/           # Utility functions
│   └── prisma/          # Database seed scripts
├── prisma/
│   └── schema.prisma    # Database schema
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Docker & Docker Compose (optional)

### Installation

1. **Clone and navigate to the service directory**

```bash
cd services/registry-service
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup database**

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### Running the Service

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

**Using Docker:**
```bash
docker-compose up
```

The service will start on `http://localhost:3001`

## API Documentation

Once running, access the interactive Swagger documentation at:
- **Swagger UI**: http://localhost:3001/api-docs

## API Endpoints

### Customers

- `POST /api/customers` - Create new customer
- `GET /api/customers` - List all customers (with pagination)
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Companies

- `POST /api/companies` - Create new company
- `GET /api/companies` - List all companies (with pagination)
- `GET /api/companies/:id` - Get company by ID
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Lookup

- `GET /api/lookup/customer?taxId=xxx` - Lookup customer by tax ID
- `GET /api/lookup/customer?email=xxx` - Lookup customer by email
- `GET /api/lookup/company?taxId=xxx` - Lookup company by tax ID
- `GET /api/lookup/company?registrationNumber=xxx` - Lookup company by registration number

## Example API Usage

### Create a Customer

```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default-tenant" \
  -d '{
    "type": "INDIVIDUAL",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0100",
    "taxId": "12-3456789",
    "address": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "United States"
    },
    "contact": {
      "email": "john.doe@example.com",
      "phone": "+1-555-0100"
    },
    "bankAccount": {
      "bankName": "First National Bank",
      "accountNumber": "1234567890",
      "routingNumber": "123456789"
    }
  }'
```

### Create a Company

```bash
curl -X POST http://localhost:3001/api/companies \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default-tenant" \
  -d '{
    "companyType": "CORPORATION",
    "legalName": "Acme Corporation",
    "tradingName": "Acme Corp",
    "taxId": "45-9876543",
    "registrationNumber": "CORP-2020-045",
    "industry": "Technology",
    "address": {
      "street": "456 Park Avenue",
      "city": "London",
      "zipCode": "SW1A 1AA",
      "country": "United Kingdom"
    },
    "contact": {
      "email": "info@acmecorp.com",
      "phone": "+1-555-0200",
      "website": "https://acmecorp.com"
    }
  }'
```

### Lookup by Tax ID

```bash
curl http://localhost:3001/api/lookup/customer?taxId=12-3456789 \
  -H "x-tenant-id: default-tenant"
```

## Validation Rules

### Tax ID Validation

- **United States**: EIN format `XX-XXXXXXX` (9 digits with hyphen)
- **United Kingdom**: VAT format `GB999999999` or `GB999 9999 99`
- **Germany**: 11-digit Tax ID
- **France**: 9-digit Tax ID
- **Other**: Minimum 5 characters

### IBAN Validation

Format: 2 letters (country code) + 2 digits (check digits) + 4-30 alphanumeric characters

Example: `GB82WEST12345698765432`

### SWIFT Code Validation

Format: 4 letters (bank) + 2 letters (country) + 2 characters (location) + 3 optional characters (branch)

Example: `BARCGB22XXX`

## Multi-Tenant Isolation

All data is isolated by tenant using the `tenantId` field. The middleware extracts the tenant ID from the `x-tenant-id` header.

In production, the tenant ID should be extracted from the JWT token after authentication.

## Database Schema

### Core Entities

- **Customer** - Individual and company customers
- **Company** - Legal entities
- **Address** - Physical addresses
- **Contact** - Contact information
- **BankAccount** - Banking details

See `prisma/schema.prisma` for complete schema definition.

## Testing

Run tests:
```bash
npm test
```

## Development

### Database Management

- **Generate Prisma Client**: `npm run db:generate`
- **Create Migration**: `npm run db:migrate`
- **Deploy Migration**: `npm run db:migrate:deploy`
- **Reset Database**: `npx prisma migrate reset`
- **Open Prisma Studio**: `npm run db:studio`
- **Seed Database**: `npm run db:seed`

### Environment Variables

Key environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `PORT` - Server port (default: 3001)
- `CORS_ORIGIN` - Allowed CORS origin
- `REDIS_URL` - Redis connection string (optional)

## Docker Deployment

### Build and Run

```bash
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Redis cache on port 6379
- Registry Service on port 3001

### Production Build

```bash
docker build -t registry-service .
docker run -p 3001:3001 --env-file .env registry-service
```

## Security Considerations

- ✅ Tenant isolation enforced at middleware level
- ✅ JWT authentication support
- ✅ Input validation with Zod schemas
- ✅ SQL injection prevention via Prisma ORM
- ✅ CORS protection
- ✅ Security headers via Helmet
- ✅ Error message sanitization

## Future Enhancements

- [ ] Redis caching for lookup operations
- [ ] Batch import/export functionality
- [ ] Document storage for company registrations
- [ ] Advanced search and filtering
- [ ] Customer/company merge functionality
- [ ] Audit trail for data changes
- [ ] GDPR compliance features (data export, deletion)
- [ ] Webhook support for data changes
- [ ] GraphQL API alternative
- [ ] Rate limiting
- [ ] API versioning

## License

Proprietary - Collector Platform

