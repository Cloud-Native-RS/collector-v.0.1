# Invoices & Billing Microservice

Production-ready microservice for invoice management, payment tracking, and dunning automation.

## Overview

The Invoices Service is responsible for invoice management, billing, and payment tracking in the Collector platform. It generates invoices from delivery notes, calculates taxes, tracks payments, handles dunning for overdue invoices, and integrates with accounting systems.

## Features

### Core Capabilities
- ✅ **Invoice Generation** - Create invoices from delivery notes
- ✅ **Tax Calculation** - Automatic tax calculation per line item
- ✅ **Payment Tracking** - Track payment status and history
- ✅ **Dunning Automation** - Automated reminders for overdue invoices
- ✅ **PDF Generation** - Generate professional PDF invoices
- ✅ **Accounting Integration** - Push invoices to external accounting systems
- ✅ **Multi-Tenant Support** - Complete tenant isolation
- ✅ **Event-Driven** - NATS-based event publishing
- ✅ **Multi-Currency** - Support for multiple currencies
- ✅ **RESTful API** - Complete CRUD operations

## Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Message Queue**: NATS
- **PDF Generation**: Puppeteer
- **Templating**: Handlebars

## Project Structure

```
services/invoices-service/
├── src/
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic layer
│   ├── utils/           # Utility functions
│   └── prisma/          # Database seed scripts
├── prisma/
│   └── schema.prisma    # Database schema
├── templates/
│   └── invoice.hbs      # Invoice template
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Docker & Docker Compose
- NATS Server

### Installation

1. Navigate to service directory
```bash
cd services/invoices-service
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Setup database
```bash
npm run db:generate
npm run db:migrate
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

The service will start on `http://localhost:3002`

## API Documentation

Access the interactive Swagger documentation at:
- **Swagger UI**: http://localhost:3002/api-docs

## API Endpoints

### Invoices

- `POST /api/invoices` - Create invoice from delivery note
- `GET /api/invoices` - List invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `POST /api/invoices/:id/issue` - Issue invoice
- `GET /api/invoices/:id/pdf` - Generate PDF invoice
- `POST /api/invoices/:id/accounting` - Push to accounting system
- `POST /api/invoices/:id/cancel` - Cancel invoice

### Payments

- `POST /api/payments` - Record payment
- `GET /api/payments` - List payments

### Dunning

- `POST /api/dunnings` - Create dunning
- `POST /api/dunnings/process` - Process all overdue invoices
- `POST /api/dunnings/:id/send` - Send dunning reminder
- `GET /api/dunnings` - List dunnings

## Example API Usage

### Create Invoice

```bash
curl -X POST http://localhost:3002/api/invoices \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default-tenant" \
  -d '{
    "deliveryNoteId": "del-note-123",
    "customerId": "customer-id",
    "lineItems": [
      {
        "productId": "prod-1",
        "description": "Product Name",
        "quantity": 2,
        "unitPrice": 50.00,
        "taxPercent": 20.0
      }
    ],
    "currency": "USD",
    "dueDays": 30
  }'
```

### Record Payment

```bash
curl -X POST http://localhost:3002/api/payments \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default-tenant" \
  -d '{
    "invoiceId": "invoice-id",
    "amount": 120.00,
    "provider": "STRIPE",
    "transactionId": "txn_123",
    "paymentMethod": "card"
  }'
```

## Invoice Flow

1. **Create** - Invoice created from delivery note
2. **Issue** - Invoice issued to customer
3. **Payment** - Payment recorded against invoice
4. **Status Update** - Invoice status updated automatically
5. **Dunning** - Overdue invoices trigger reminders
6. **Accounting** - Invoice pushed to accounting system

## Business Logic

### Tax Calculation

- Taxes calculated per line item
- Support for different tax rates per item
- Configuration per tenant

### Payment Status

- **DRAFT** - Invoice created but not issued
- **ISSUED** - Invoice sent to customer
- **PAID** - Fully paid
- **PARTIALLY_PAID** - Partial payment received
- **OVERDUE** - Past due date
- **CANCELED** - Invoice canceled

### Dunning Process

- Automated checks for overdue invoices
- Multiple reminder levels (30, 45, 60 days)
- Configurable escalation
- Email notifications

## Event-Driven Architecture

### Published Events

- `invoice.issued` - When invoice is issued
- `invoice.paid` - When invoice is paid
- `invoice.overdue` - When invoice becomes overdue
- `invoice.canceled` - When invoice is canceled
- `dunning.created` - When dunning is created
- `dunning.sent` - When dunning is sent

### Consumed Events (Future)

- `delivery.note.confirmed` - Trigger invoice creation
- `payment.processed` - Update invoice status

## Integration Points

### Registry Service

- Validate customer existence
- Get customer details

### Payment Service

- Record payment transactions
- Update payment status

### Accounting Systems

- Export invoices
- Sync payment data

## Multi-Tenant Support

All data is isolated by tenant using the `tenantId` field. All queries are filtered by tenant.

## Security

- JWT authentication
- Tenant isolation
- Input validation
- SQL injection prevention
- CORS protection

## Testing

Run tests:
```bash
npm test
```

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions.

## License

Proprietary - Collector Platform

