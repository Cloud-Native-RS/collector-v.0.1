# Delivery Notes & Logistics Microservice

A production-ready microservice for managing delivery documentation, tracking, and logistics operations after order fulfillment.

## Features

- ✅ **Delivery Note Generation** - Automatically create delivery notes from fulfilled orders
- ✅ **Carrier Integration** - Support for DHL, UPS, GLS, and generic carrier APIs
- ✅ **Tracking Management** - Track shipments with real-time updates from carriers
- ✅ **Delivery Confirmation** - Support for proof of delivery with file uploads
- ✅ **Inventory Sync** - Automatic inventory deduction when shipments are dispatched
- ✅ **Event-Driven Architecture** - Consume order.fulfilled events and emit delivery events
- ✅ **PDF Generation** - Generate delivery notes as PDF documents
- ✅ **Multi-Tenant Support** - Full tenant isolation for SaaS deployments
- ✅ **REST API** - Comprehensive RESTful API with OpenAPI documentation

## Tech Stack

- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Messaging**: RabbitMQ for event-driven communication
- **File Storage**: Local filesystem (configurable for S3/cloud storage)
- **PDF Generation**: PDFKit
- **API Documentation**: Swagger/OpenAPI 3.0

## Project Structure

```
delivery-service/
├── src/
│   ├── config/
│   │   └── swagger.ts              # OpenAPI documentation config
│   ├── integrations/
│   │   ├── base-carrier.ts         # Base carrier integration class
│   │   ├── carrier-factory.ts      # Factory for carrier instances
│   │   ├── dhl-carrier.ts          # DHL integration
│   │   ├── ups-carrier.ts          # UPS integration
│   │   ├── gls-carrier.ts          # GLS integration
│   │   └── generic-carrier.ts      # Generic carrier integration
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT authentication
│   │   ├── tenant.middleware.ts    # Multi-tenant isolation
│   │   └── error-handler.ts        # Error handling
│   ├── routes/
│   │   ├── delivery-notes.routes.ts # Delivery note endpoints
│   │   └── carriers.routes.ts      # Carrier management endpoints
│   ├── services/
│   │   ├── delivery.service.ts     # Delivery business logic
│   │   ├── carrier.service.ts      # Carrier management
│   │   └── inventory-sync.service.ts # Inventory service integration
│   ├── utils/
│   │   ├── event-publisher.ts      # RabbitMQ event publisher
│   │   ├── event-consumer.ts       # RabbitMQ event consumer
│   │   ├── pdf-generator.ts        # PDF generation utility
│   │   ├── number-generator.ts     # Delivery number generation
│   │   └── validation.ts           # Zod validation schemas
│   ├── workers/
│   │   └── tracking.worker.ts      # Cron job for polling carrier APIs
│   ├── prisma/
│   │   └── seed.ts                 # Database seed script
│   └── index.ts                    # Application entry point
├── prisma/
│   └── schema.prisma               # Database schema
├── Dockerfile                      # Docker build configuration
├── docker-compose.yml              # Development environment
├── package.json                    # Dependencies and scripts
└── tsconfig.json                   # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- RabbitMQ (optional, for event-driven features)
- Docker & Docker Compose (recommended)

### Installation

1. **Clone and navigate to the service:**

```bash
cd services/delivery-service
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

Create a `.env` file:

```env
DATABASE_URL="postgresql://delivery_user:delivery_pass@localhost:5432/delivery_db?schema=public"
JWT_SECRET="your-jwt-secret"
RABBITMQ_URL="amqp://localhost:5672"
INVENTORY_SERVICE_URL="http://localhost:3003"
PORT=3002
CORS_ORIGIN="http://localhost:3000"
NODE_ENV="development"
```

4. **Generate Prisma Client:**

```bash
npm run db:generate
```

5. **Run database migrations:**

```bash
npm run db:migrate
```

6. **Seed the database:**

```bash
npm run db:seed
```

7. **Start the service:**

```bash
npm run dev
```

The service will be available at `http://localhost:3002`

### Docker Setup

1. **Start all services:**

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5433
- RabbitMQ on ports 5673 (AMQP) and 15673 (Management UI)
- Delivery service on port 3002

2. **View logs:**

```bash
docker-compose logs -f delivery-service
```

3. **Run migrations:**

The service will automatically run migrations on startup. To run manually:

```bash
docker-compose exec delivery-service npm run db:migrate:deploy
```

## API Endpoints

### Delivery Notes

- `POST /api/delivery-notes` - Create delivery note from fulfilled order
- `GET /api/delivery-notes` - List delivery notes (with filters)
- `GET /api/delivery-notes/:id` - Get delivery note details
- `PUT /api/delivery-notes/:id/dispatch` - Dispatch delivery (trigger carrier API & inventory deduction)
- `POST /api/delivery-notes/:id/confirm` - Confirm delivery (with optional proof upload)
- `GET /api/delivery-notes/:id/tracking` - Get tracking info from carrier API
- `GET /api/delivery-notes/:id/pdf` - Download delivery note as PDF

### Carriers

- `POST /api/carriers` - Create carrier
- `GET /api/carriers` - List carriers
- `GET /api/carriers/:id` - Get carrier details
- `PUT /api/carriers/:id` - Update carrier
- `DELETE /api/carriers/:id` - Delete carrier

### Documentation

- `GET /api-docs` - Interactive Swagger documentation
- `GET /health` - Health check endpoint

## Example Usage

### Create Delivery Note

```bash
curl -X POST http://localhost:3002/api/delivery-notes \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default-tenant" \
  -d '{
    "orderId": "order-uuid",
    "customerId": "customer-uuid",
    "deliveryAddressId": "address-uuid",
    "items": [
      {
        "productId": "product-uuid",
        "description": "Product Name",
        "quantity": 2,
        "unit": "pcs"
      }
    ]
  }'
```

### Dispatch Delivery

```bash
curl -X PUT http://localhost:3002/api/delivery-notes/{id}/dispatch \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default-tenant" \
  -d '{
    "carrierId": "carrier-uuid"
  }'
```

### Confirm Delivery with Proof

```bash
curl -X POST http://localhost:3002/api/delivery-notes/{id}/confirm \
  -H "x-tenant-id: default-tenant" \
  -F "proofOfDelivery=@/path/to/signature.pdf"
```

## Event-Driven Integration

### Consuming Events

The service automatically listens for `order.fulfilled` events from RabbitMQ and creates delivery notes.

### Publishing Events

The service publishes the following events:

- `delivery.created` - When a delivery note is created
- `delivery.dispatched` - When a delivery is dispatched
- `delivery.confirmed` - When a delivery is confirmed

## Carrier Integration

The service supports multiple carriers through a factory pattern. To add a new carrier:

1. Create a new carrier class extending `BaseCarrier`
2. Implement `createShipment()` and `getTrackingInfo()` methods
3. Add the carrier to `CarrierFactory`

The service includes built-in support for:
- DHL Express
- UPS
- GLS
- Generic/Unknown carriers

All carrier API calls include:
- Exponential backoff retry logic
- Error handling
- Timeout protection

## Tracking Worker

A background worker polls carrier APIs every 30 minutes to update tracking information. To run separately:

```bash
npm run worker:tracking
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Database Schema

### DeliveryNote
- Unique delivery number
- Order and customer references
- Status tracking
- Carrier and tracking information
- Proof of delivery URL

### DeliveryItem
- Product references
- Quantities and descriptions
- Linked to delivery notes

### Carrier
- Name and API configuration
- Tracking URL templates
- API credentials (encrypted)

### DeliveryEvent
- Event history
- Status changes
- Carrier metadata

## Security

- JWT authentication
- Multi-tenant data isolation
- Input validation with Zod
- SQL injection prevention (Prisma)
- Helmet security headers
- CORS protection

## Production Deployment

### Environment Variables

Set the following in production:

```env
NODE_ENV=production
DATABASE_URL=<production-db-url>
JWT_SECRET=<strong-secret>
RABBITMQ_URL=<rabbitmq-url>
INVENTORY_SERVICE_URL=<inventory-service-url>
```

### Docker Deployment

```bash
docker build -t delivery-service:latest .
docker run -p 3002:3002 --env-file .env.production delivery-service:latest
```

### Database Migrations

```bash
npm run db:migrate:deploy
```

## Monitoring

The service provides:

- Health check endpoint: `GET /health`
- Structured logging
- Error tracking
- Performance metrics (via middleware)

## License

MIT

