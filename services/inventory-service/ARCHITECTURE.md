# Inventory Service - Architecture Documentation

## Overview

The Inventory & Product Management Service is a domain-driven microservice built with TypeScript, Express.js, and Prisma. It manages the central inventory system for the Collector platform, handling products, stock, warehouses, suppliers, and purchase orders.

## Architecture Principles

### Domain-Driven Design
- Clear separation of concerns by domain entities
- Rich domain models with business logic
- Service layer encapsulation

### Clean Architecture
- **Routes** - HTTP request handling and validation
- **Services** - Business logic and domain rules
- **Database** - Data persistence layer (Prisma)
- **Middleware** - Cross-cutting concerns (auth, tenant isolation, errors)

### Multi-Tenancy
- Complete data isolation per tenant
- Tenant-aware queries at the service layer
- Middleware-based tenant validation

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway / Load Balancer            │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                 Inventory Service                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Product  │  │ Stock    │  │ Purchase │              │
│  │ Service  │  │ Service  │  │  Order   │              │
│  └──────────┘  └──────────┘  │ Service  │              │
│  ┌──────────┐  ┌──────────┐  └──────────┘              │
│  │Warehouse │  │ Supplier │  ┌──────────┐              │
│  │ Service  │  │ Service  │  │Delivery  │              │
│  └──────────┘  └──────────┘  │  Sync    │              │
│                               └──────────┘              │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                    │
│  Products | Stock | Warehouses | POs | Suppliers          │
└─────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Domain Models

#### Product
- Master data for all sellable items
- SKU-based identification
- Categorization and pricing
- Tenant-scoped

#### Warehouse
- Physical storage locations
- Capacity management
- Status tracking

#### Stock
- Real-time inventory levels
- Reserved quantity tracking
- Reorder points and thresholds
- Multi-warehouse support

#### Supplier
- Vendor contact information
- Purchase order association

#### Purchase Order
- Supplier orders with line items
- Status workflow (Draft → Sent → Received)
- Stock updates on receipt

#### Delivery Note Sync
- Integration with delivery service
- Stock deductions/additions
- Transaction tracking

### 2. Service Layer

#### ProductService
- CRUD operations
- SKU validation and uniqueness
- Search and filtering

#### WarehouseService
- Warehouse management
- Capacity tracking
- Stock association

#### StockService
- Stock adjustments (IN, OUT, ADJUSTMENT, TRANSFER)
- Reservation management
- Availability checking
- Low stock detection
- Transaction logging

#### SupplierService
- Supplier CRUD
- Contact management

#### PurchaseOrderService
- PO creation and management
- Receiving workflow
- Automatic stock updates
- Status transitions

#### DeliverySyncService
- Delivery note synchronization
- Stock deduction logic
- Transaction recording

### 3. Middleware

#### Tenant Middleware
- Extracts tenant ID from headers
- Adds tenant context to requests
- Validates tenant presence

#### Authentication Middleware
- JWT token validation
- User context extraction
- Optional for development

#### Error Handler
- Centralized error handling
- Consistent error responses
- Error logging

### 4. Data Flow

#### Stock Reservation Flow
```
Orders Service
    ↓ Request stock check
StockService.checkAvailability()
    ↓ Returns availability
Orders Service
    ↓ Reserve stock
StockService.reserve()
    ↓ Update stock & create transaction
Response with updated stock
```

#### Delivery Sync Flow
```
Delivery Service
    ↓ Delivery created
DeliverySyncService.syncDeliveryNote()
    ↓ Adjust stock
StockService.adjust() [OUT transaction]
    ↓ Create transaction record
Response success
```

#### Purchase Order Receipt Flow
```
Purchase Order marked as received
    ↓ Create receive request
PurchaseOrderService.receive()
    ↓ For each line item
    StockService.adjust() [IN transaction]
    Update line item received quantity
    ↓ Check if all received
    Update PO status (PARTIALLY_RECEIVED or RECEIVED)
Response with updated PO
```

## Database Schema

### Key Relationships

- **Product** ↔ **Stock** (One-to-Many)
- **Warehouse** ↔ **Stock** (One-to-Many)
- **Stock** (Product × Warehouse) is unique
- **Supplier** ↔ **PurchaseOrder** (One-to-Many)
- **PurchaseOrder** ↔ **PurchaseOrderLineItem** (One-to-Many)
- **Product** ↔ **PurchaseOrderLineItem** (One-to-Many)
- **DeliveryNoteSync** tracks products and warehouses

### Indexes

Critical indexes for performance:
- `products(sku)` - Unique product lookup
- `stock(productId, warehouseId)` - Unique stock record
- `stock(tenantId)` - Tenant isolation
- `stock_transactions(createdAt)` - Audit trail queries
- `purchase_orders(status)` - Status filtering

## Security Architecture

### Multi-Tenant Isolation

1. **Database Level**
   - All entities include `tenantId`
   - Queries always filter by tenant
   - Foreign key constraints maintain isolation

2. **Application Level**
   - Tenant middleware extracts ID
   - Services enforce tenant scoping
   - Validation prevents tenant mismatch

### Authentication Flow

```
Client
    ↓ JWT Token
Auth Middleware
    ↓ Validate token
Extract user + tenant context
    ↓ Add to request
Routes → Services → Database
```

## Event-Driven Design

### Stock Events

- `stock.reserved` - Stock reserved for order
- `stock.unreserved` - Reservation released
- `stock.adjusted` - Manual adjustment
- `stock.low` - Low stock alert
- `stock.received` - Items received from PO

### Purchase Order Events

- `po.created` - New purchase order
- `po.received` - Items received
- `po.canceled` - PO canceled

## Scalability Considerations

### Horizontal Scaling

- Stateless service design
- Database connection pooling
- Shared PostgreSQL database
- Redis for caching (optional)

### Performance Optimization

1. **Caching**
   - Product information
   - Stock availability
   - Warehouse details

2. **Database**
   - Proper indexing
   - Query optimization
   - Connection pooling

3. **API**
   - Pagination for list endpoints
   - Efficient filtering
   - Batch operations where possible

## Monitoring & Observability

### Health Checks
- `/health` endpoint
- Database connectivity
- Service status

### Logging
- Request logging (Morgan)
- Error logging
- Transaction audit trail

### Metrics (Future)
- Stock levels over time
- Order velocity
- Low stock frequency
- PO fulfillment rates

## Integration Points

### Orders Service
- Stock availability checking
- Stock reservation
- Reservation release

### Delivery Service
- Delivery note sync
- Stock deduction
- Shipping tracking

### Invoices Service
- Product pricing
- Tax calculations

### Offers Service (Optional)
- Product information
- Inventory constraints

## Deployment Architecture

### Development
- Single PostgreSQL instance
- Local development server
- Docker Compose setup

### Production
- PostgreSQL cluster (primary + replicas)
- Multiple service instances
- Load balancer
- Redis cluster for caching
- Monitoring and logging stack

## Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16+
- **ORM**: Prisma
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker

## Best Practices

1. **Always validate tenant isolation**
2. **Use transactions for complex operations**
3. **Implement proper error handling**
4. **Log all stock transactions**
5. **Monitor low stock levels**
6. **Cache frequently accessed data**
7. **Optimize database queries**
8. **Use pagination for large datasets**

## Future Enhancements

- Event bus integration (Kafka/RabbitMQ)
- Real-time stock updates via WebSockets
- Advanced analytics and reporting
- Multi-location stock transfers
- Batch operations API
- GraphQL endpoint
- Inventory forecasting

