# Orders Service

Microservice responsible for order processing and fulfillment, ensuring seamless conversion from approved offers to fulfilled orders.

## Features

- ✅ Create orders automatically from approved offers
- ✅ Validate inventory availability before confirming orders
- ✅ Manage order statuses throughout lifecycle (pending → confirmed → processing → shipped → delivered → canceled)
- ✅ Handle shipping address and logistics information
- ✅ Integrate with payment processing systems (Stripe, PayPal, manual)
- ✅ Provide APIs for CRM/ERP integration and customer tracking
- ✅ Real-time order status tracking with audit trail
- ✅ Multi-tenant support with tenant isolation

## Tech Stack

- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Message Bus**: RabbitMQ (for async workflows)
- **Cache**: Redis
- **API Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- RabbitMQ 3+

## Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server Configuration
NODE_ENV=development
PORT=3002

# Database
DATABASE_URL=postgresql://orders_user:orders_pass@localhost:5432/orders_db?schema=public

# JWT Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# External Services
OFFERS_SERVICE_URL=http://localhost:3003
INVENTORY_SERVICE_URL=http://localhost:3004
PAYMENT_GATEWAY_URL=https://api.stripe.com/v1
PAYMENT_GATEWAY_API_KEY=sk_test_your_key
SHIPPING_SERVICE_URL=http://localhost:3005

# Message Bus
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=orders_exchange
```

## Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# Run migrations
docker-compose exec orders-service npm run db:migrate:deploy

# View logs
docker-compose logs -f orders-service
```

## API Endpoints

### Orders

- `POST /api/orders` - Create order from offer or direct order data
- `GET /api/orders` - List orders with filters (customer, status, date range)
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/lookup?offerId=...` - Lookup order by offer ID
- `PUT /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/cancel` - Cancel order
- `POST /api/orders/:id/payment` - Process payment
- `GET /api/orders/:id/tracking` - Get tracking information

### Documentation

- `GET /api-docs` - Swagger API documentation
- `GET /health` - Health check endpoint

## Order Lifecycle

1. **PENDING** - Order created, awaiting confirmation
2. **CONFIRMED** - Order confirmed, payment pending or received
3. **PROCESSING** - Order being prepared for shipment
4. **SHIPPED** - Order shipped, tracking available
5. **DELIVERED** - Order delivered to customer
6. **CANCELED** - Order canceled (cannot be reinstated)

## Payment Integration

### Stripe

Configure `PAYMENT_GATEWAY_API_KEY` with your Stripe secret key. The service supports:

- Payment intents
- Refunds (full and partial)
- Webhook handling (implement via background workers)

### Manual Payments

For bank transfers or cash on delivery, use provider `MANUAL`. Payments are marked as pending and can be manually confirmed later.

## Integration Points

### Offers Service
- Validates offer status before order creation
- Marks offers as consumed after order creation

### Inventory Service
- Validates stock availability
- Reserves inventory on order confirmation
- Releases inventory on order cancellation

### Shipping Service
- Calculates shipping costs
- Creates shipping labels
- Tracks delivery status

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Database Migrations

```bash
# Create new migration
npm run db:migrate

# Deploy migrations (production)
npm run db:migrate:deploy

# Seed database (development)
npm run db:seed
```

## Architecture

The service follows a domain-driven design with clear separation of concerns:

- **Routes** - HTTP request handling and validation
- **Services** - Business logic (OrderService, PaymentService)
- **Integrations** - External service clients (Offers, Inventory, Payment Gateway, Shipping)
- **Workers** - Background job processing for async tasks
- **Middleware** - Authentication, tenant isolation, error handling

## License

Proprietary - Collector Platform

