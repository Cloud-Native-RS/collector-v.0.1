# Event-Driven Integration Documentation

## Overview

This document describes the complete event-driven integration architecture for the Collector microservices platform. All services communicate via RabbitMQ using a standardized event bus pattern.

## Event Bus Architecture

- **Message Broker**: RabbitMQ
- **Exchange Type**: Topic Exchange
- **Exchange Name**: `collector-events`
- **Persistence**: All events are persisted
- **Delivery Guarantee**: At-least-once delivery with acknowledgment

## Event Flow Diagram

```
Triggers → Events → Consumers → Actions
```

## Complete Event Integration Table

| Event | Producer | Consumer | Purpose | Trigger |
|-------|----------|----------|---------|---------|
| `offer.approved` | Offers | Orders | Trigger order creation | When offer is approved by customer |
| `order.created` | Orders | Inventory | Reserve stock | When order is created (PENDING) |
| `order.confirmed` | Orders | Delivery Notes | Generate delivery note | When order status changes to CONFIRMED |
| `delivery.dispatched` | Delivery Notes | Inventory | Deduct stock | When delivery is dispatched with carrier |
| `delivery.confirmed` | Delivery Notes | Invoices | Generate invoice | When delivery is confirmed (DELIVERED) |
| `invoice.issued` | Invoices | Accounting | Sync invoice | When invoice is issued to customer |
| `invoice.paid` | Payment / Invoices | CRM | Update payment | When invoice payment is received |
| `stock.low` | Inventory | Procurement | Trigger PO creation | When stock falls below reorder level |
| `task.completed` | Project Mgmt | HR / Payroll | Optional reporting | When task is marked as completed |
| `employee.hired` | HR | Project Mgmt | Assign resources | When new employee is hired |
| `payroll.processed` | HR | Accounting | Payroll reporting | When payroll is processed |

## Event Schemas

### 1. offer.approved

**Producer**: Offers Service  
**Consumer**: Orders Service

```typescript
{
  type: "offer.approved",
  timestamp: "2024-01-15T10:30:00.000Z",
  tenantId: "tenant-123",
  source: "offers-service",
  correlationId?: "corr-123",
  data: {
    offerId: "uuid",
    offerNumber: "OFF-2024-001",
    customerId: "uuid",
    validUntil: "2024-02-15T10:30:00.000Z",
    currency: "USD",
    grandTotal: "1500.00",
    lineItems: [
      {
        productId?: "uuid",
        description: "Product Name",
        quantity: "5",
        unitPrice: "300.00",
        discountPercent?: "10",
        taxPercent?: "20"
      }
    ]
  }
}
```

**Consumer Action**: Orders Service automatically creates an order from the approved offer.

---

### 2. order.created

**Producer**: Orders Service  
**Consumer**: Inventory Service

```typescript
{
  type: "order.created",
  timestamp: "2024-01-15T10:35:00.000Z",
  tenantId: "tenant-123",
  source: "orders-service",
  correlationId: "corr-123",
  data: {
    orderId: "uuid",
    orderNumber: "ORD-2024-001",
    customerId: "uuid",
    offerId?: "uuid",
    lineItems: [
      {
        productId: "uuid",
        sku?: "SKU-123",
        description: "Product Name",
        quantity: 5,
        unitPrice: "300.00",
        warehouseId?: "uuid"
      }
    ],
    currency: "USD",
    grandTotal: "1500.00"
  }
}
```

**Consumer Action**: Inventory Service reserves stock for the order items.

---

### 3. order.confirmed

**Producer**: Orders Service  
**Consumer**: Delivery Notes Service

```typescript
{
  type: "order.confirmed",
  timestamp: "2024-01-15T10:40:00.000Z",
  tenantId: "tenant-123",
  source: "orders-service",
  correlationId: "corr-123",
  data: {
    orderId: "uuid",
    orderNumber: "ORD-2024-001",
    customerId: "uuid",
    shippingAddressId: "uuid",
    lineItems: [
      {
        productId: "uuid",
        description: "Product Name",
        quantity: 5,
        unit: "pcs"
      }
    ]
  }
}
```

**Consumer Action**: Delivery Notes Service creates a delivery note for the confirmed order.

---

### 4. delivery.dispatched

**Producer**: Delivery Notes Service  
**Consumer**: Inventory Service

```typescript
{
  type: "delivery.dispatched",
  timestamp: "2024-01-15T11:00:00.000Z",
  tenantId: "tenant-123",
  source: "delivery-service",
  correlationId: "corr-123",
  data: {
    deliveryNoteId: "uuid",
    deliveryNumber: "DN-2024-001",
    orderId: "uuid",
    items: [
      {
        productId: "uuid",
        quantity: 5,
        warehouseId: "uuid"
      }
    ],
    trackingNumber?: "TRACK123",
    carrierId?: "uuid"
  }
}
```

**Consumer Action**: Inventory Service deducts stock from warehouse for shipped items.

---

### 5. delivery.confirmed

**Producer**: Delivery Notes Service  
**Consumer**: Invoices Service

```typescript
{
  type: "delivery.confirmed",
  timestamp: "2024-01-15T14:00:00.000Z",
  tenantId: "tenant-123",
  source: "delivery-service",
  correlationId: "corr-123",
  data: {
    deliveryNoteId: "uuid",
    deliveryNumber: "DN-2024-001",
    orderId: "uuid",
    customerId: "uuid",
    proofOfDeliveryUrl?: "https://..."
  }
}
```

**Consumer Action**: Invoices Service generates an invoice for the delivered order.

---

### 6. invoice.issued

**Producer**: Invoices Service  
**Consumer**: Accounting Service

```typescript
{
  type: "invoice.issued",
  timestamp: "2024-01-15T14:30:00.000Z",
  tenantId: "tenant-123",
  source: "invoices-service",
  correlationId: "corr-123",
  data: {
    invoiceId: "uuid",
    invoiceNumber: "INV-2024-001",
    customerId: "uuid",
    orderId?: "uuid",
    deliveryNoteId?: "uuid",
    currency: "USD",
    subtotal: "1250.00",
    taxTotal: "250.00",
    grandTotal: "1500.00",
    dueDate: "2024-02-15T14:30:00.000Z",
    lineItems: [
      {
        description: "Product Name",
        quantity: "5",
        unitPrice: "250.00",
        total: "1250.00"
      }
    ]
  }
}
```

**Consumer Action**: Accounting Service syncs the invoice to accounting system.

---

### 7. invoice.paid

**Producer**: Payment / Invoices Service  
**Consumer**: CRM Service

```typescript
{
  type: "invoice.paid",
  timestamp: "2024-01-16T10:00:00.000Z",
  tenantId: "tenant-123",
  source: "payment-service",
  correlationId: "corr-123",
  data: {
    invoiceId: "uuid",
    invoiceNumber: "INV-2024-001",
    customerId: "uuid",
    amount: "1500.00",
    paymentMethod?: "STRIPE",
    paymentDate: "2024-01-16T10:00:00.000Z",
    currency: "USD"
  }
}
```

**Consumer Action**: CRM Service updates customer payment records.

---

### 8. stock.low

**Producer**: Inventory Service  
**Consumer**: Procurement Service

```typescript
{
  type: "stock.low",
  timestamp: "2024-01-15T09:00:00.000Z",
  tenantId: "tenant-123",
  source: "inventory-service",
  correlationId?: "corr-123",
  data: {
    productId: "uuid",
    productName: "Product Name",
    sku: "SKU-123",
    warehouseId: "uuid",
    warehouseName: "Main Warehouse",
    currentQuantity: 5,
    minimumThreshold: 10,
    reorderLevel: 20
  }
}
```

**Consumer Action**: Procurement Service creates a purchase order for restocking.

---

### 9. task.completed

**Producer**: Project Management Service  
**Consumer**: HR / Payroll Service (optional)

```typescript
{
  type: "task.completed",
  timestamp: "2024-01-15T17:00:00.000Z",
  tenantId: "tenant-123",
  source: "project-management-service",
  correlationId?: "corr-123",
  data: {
    taskId: "uuid",
    taskName: "Implement Feature X",
    projectId: "uuid",
    projectName: "Project Alpha",
    assignedResourceId?: "uuid",
    estimatedHours?: 8,
    actualHours?: 10,
    completedAt: "2024-01-15T17:00:00.000Z"
  }
}
```

**Consumer Action**: HR/Payroll Service records billable hours (optional reporting).

---

### 10. employee.hired

**Producer**: HR Service  
**Consumer**: Project Management Service

```typescript
{
  type: "employee.hired",
  timestamp: "2024-01-15T08:00:00.000Z",
  tenantId: "tenant-123",
  source: "hr-service",
  correlationId?: "corr-123",
  data: {
    employeeId: "uuid",
    employeeNumber: "EMP-001",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@company.com",
    position: "Software Engineer",
    department?: "Engineering",
    hireDate: "2024-01-15T08:00:00.000Z"
  }
}
```

**Consumer Action**: Project Management Service creates resource record for assignment.

---

### 11. payroll.processed

**Producer**: HR Service  
**Consumer**: Accounting Service

```typescript
{
  type: "payroll.processed",
  timestamp: "2024-01-31T18:00:00.000Z",
  tenantId: "tenant-123",
  source: "hr-service",
  correlationId?: "corr-123",
  data: {
    payrollId: "uuid",
    payrollPeriod: "2024-01",
    totalAmount: "50000.00",
    currency: "USD",
    employeeCount: 25,
    processedAt: "2024-01-31T18:00:00.000Z"
  }
}
```

**Consumer Action**: Accounting Service records payroll expenses.

---

## Implementation Status

### ✅ Completed

1. **Shared Event Types** - Standardized event type definitions
2. **Event Bus Library** - Reusable RabbitMQ event bus implementation
3. **Offers Service** - Publishes `offer.approved` events

### 🚧 In Progress

4. **Orders Service** - Consumes `offer.approved`, publishes `order.created` and `order.confirmed`
5. **Inventory Service** - Consumes `order.created` and `delivery.dispatched`, publishes `stock.low`
6. **Delivery Service** - Consumes `order.confirmed`, publishes `delivery.dispatched` and `delivery.confirmed`
7. **Invoices Service** - Consumes `delivery.confirmed`, publishes `invoice.issued`
8. **Payment/CRM** - Consumes `invoice.paid`
9. **Project Management** - Publishes `task.completed`, consumes `employee.hired`
10. **HR Service** - Publishes `employee.hired` and `payroll.processed`, consumes `task.completed`
11. **Accounting** - Consumes `invoice.issued` and `payroll.processed`
12. **Procurement** - Consumes `stock.low`

## Configuration

### Environment Variables

All services require:

```bash
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

Optional:

```bash
RABBITMQ_EXCHANGE=collector-events  # Default exchange name
```

## Testing Event Integration

### Manual Testing

1. **Test offer.approved → order.created flow**:
   ```bash
   # Approve an offer
   POST /api/offers/{id}/approve
   
   # Check Orders service logs for order creation
   # Verify Inventory service received order.created event
   ```

2. **Test order.confirmed → delivery note flow**:
   ```bash
   # Confirm an order
   PUT /api/orders/{id}/status { "status": "CONFIRMED" }
   
   # Check Delivery service logs for delivery note creation
   ```

### Integration Testing

Each service should have integration tests that:
- Mock RabbitMQ connection
- Verify event publishing
- Verify event consumption and processing
- Test error handling and retries

## Error Handling

### Event Publishing Errors

- Events are logged but don't block main flow
- Failed events can be manually retried
- Consider dead letter queue for persistent failures

### Event Consumption Errors

- Automatic retries (configurable, default 3)
- Failed events after max retries go to dead letter queue
- Manual intervention required for dead letter queue

## Monitoring

### Key Metrics

- Event publish rate per service
- Event consumption rate per service
- Event processing latency
- Failed event count
- Dead letter queue size

### Logging

All events are logged with:
- Event type
- Tenant ID
- Timestamp
- Source service
- Correlation ID (if present)

## Future Enhancements

1. **Event Sourcing** - Store all events for audit trail
2. **Event Replay** - Ability to replay events for recovery
3. **Saga Pattern** - Distributed transaction management
4. **Circuit Breaker** - Prevent cascade failures
5. **Event Versioning** - Support multiple event versions

