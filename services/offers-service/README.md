# Offers Microservice

A registration-ready microservice for managing customer offers with approval workflows, price calculations, and CRM integration.

## Features

- ✅ **Offer Management**: Create, update, retrieve, and list offers with multiple line items
- ✅ **Price Calculations**: Automatic calculation of subtotals, discounts, taxes, and grand totals
- ✅ **Line Items**: Manage products/services with quantities, prices, discounts, and taxes
- ✅ **Approval Workflows**: Customer approval/rejection with email notifications
- ✅ **Versioning**: Clone offers into new revisions
- ✅ **Expiration Handling**: Automatic status updates for expired offers
- ✅ **CRM Integration**: Webhook support for pushing offer updates to external CRM systems
- ✅ **Multi-tenant**: Full tenant isolation support
- ✅ **REST API**: Complete REST API with OpenAPI/Swagger documentation
- ✅ **Background Jobs**: Scheduled tasks for expiration checks and notifications

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Documentation**: OpenAPI/Swagger
- **Testing**: Vitest

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Local Development

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Run database migrations**:
```bash
npm run db:migrate
```

4. **Generate Prisma Client**:
```bash
npm run db:generate
```

5. **Start development server**:
```bash
npm run dev
```

The service will be available at `http://localhost:3002`
API Documentation: `http://localhost:3002/api-docs`

### Docker Deployment

1. **Build and start services**:
```bash
docker-compose up -d
```

2. **View logs**:
```bash
docker-compose logs -f offers-service
```

3. **Stop services**:
```bash
docker-compose down
```

## API Endpoints

### Offers

- `POST /api/offers` - Create a new offer
- `GET /api/offers/:id` - Get offer by ID
- `GET /api/offers` - List offers with filters
- `PUT /api/offers/:id` - Update offer
- `POST /api/offers/:id/send` - Send offer (transition to SENT)
- `POST /api/offers/:id/approve` - Approve offer
- `POST /api/offers/:id/reject` - Reject offer
- `POST /api/offers/:id/clone` - Clone offer into new revision
- `GET /api/offers/lookup?customerId=...` - Lookup offers by customer

### Line Items

- `POST /api/offers/:offerId/line-items` - Add line item
- `PUT /api/offers/:offerId/line-items/:id` - Update line item
- `DELETE /api/offers/:offerId/line-items/:id` - Delete line item

### Approvals

- `POST /api/approvals/:token` - Approve/reject offer by token (public endpoint)

## Database Schema

### Offer

- `id` (UUID) - Primary key
- `offerNumber` (String) - Unique sequential number (e.g., OFF-20240115-00001)
- `customerId` (UUID) - Reference to customer
- `status` (Enum) - DRAFT, SENT, APPROVED, REJECTED, EXPIRED, CANCELLED
- `issueDate` (DateTime)
- `validUntil` (DateTime)
- `currency` (Enum) - USD, EUR, GBP, etc.
- `subtotal`, `discountTotal`, `taxTotal`, `grandTotal` (Decimal)
- `approvalToken` (String) - Token for external approval links
- `version` (Int) - Version number for revisions
- `parentOfferId` (UUID) - Reference to parent offer if revision

### OfferLineItem

- `id` (UUID)
- `offerId` (UUID)
- `productId` (UUID, nullable)
- `description` (String)
- `quantity`, `unitPrice`, `discountPercent`, `taxPercent` (Decimal)
- `totalPrice` (Decimal) - Computed value

### Approval

- `id` (UUID)
- `offerId` (UUID)
- `approverEmail` (String)
- `status` (Enum) - PENDING, APPROVED, REJECTED
- `comments` (String, nullable)
- `approvedAt` (DateTime, nullable)

## Business Logic

### Price Calculation

Line items are calculated as:
```
subtotal = quantity * unitPrice
discountDollarAmount = subtotal * (discountPercent / 100)
subtotalAfterDiscount = subtotal - discountDollarAmount
taxAmount = subtotalAfterDiscount * (taxPercent / 100)
totalPrice = subtotalAfterDiscount + taxAmount
```

Offer totals are the sum of all line item calculations.

### Expiration Handling

Offers with status `SENT` are automatically marked as `EXPIRED` when `validUntil` date passes. This is handled by a background job that runs hourly.

### Approval Workflow

1. Offer created in `DRAFT` status
2. Offer sent (transitions to `SENT`, generates approval token)
3. Customer can approve/reject via:
   - API endpoint (authenticated)
   - External link with approval token (no authentication required)
4. Status updates to `APPROVED` or `REJECTED`
5. Once approved/rejected, offer cannot be modified

### Versioning

Offers can be cloned to create new revisions. The new offer:
- Gets a new offer number
- References the original via `parentOfferId`
- Has incremented `version` number
- Starts in `DRAFT` status

## CRM Integration

The service supports integration with external CRM systems:

1. **Configure CRM URL and API key** in environment variables
2. **Automatic push**: Offers are pushed to CRM on create/update/status change
3. **Webhook format**: POST requests to `{CRM_API_URL}/webhooks/offers/update`

Integration failures are logged but do not break the main flow.

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Environment Variables

- `PORT` - Server port (default: 3002)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token validation
- `CORS_ORIGIN` - Allowed CORS origin
- `CRM_API_URL` - CRM API base URL (optional)
- `CRM_API_KEY` - CRM API key (optional)
- `REDIS_URL` - Redis connection string (optional)

## CI/CD

GitHub Actions workflow is included for automated testing and deployment. See `.github/workflows/ci.yml`.

## License

MIT

