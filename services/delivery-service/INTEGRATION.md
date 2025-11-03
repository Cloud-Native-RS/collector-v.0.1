# Delivery Service Integration Guide

This guide explains how to integrate the Delivery Service with other microservices in the Collector platform.

## Event-Driven Integration

### Consuming Events

The Delivery Service automatically consumes `order.fulfilled` events from RabbitMQ. When an order is fulfilled, a delivery note is automatically created.

**Event Format:**

```json
{
  "eventType": "order.fulfilled",
  "data": {
    "orderId": "uuid",
    "customerId": "uuid",
    "deliveryAddressId": "uuid",
    "items": [
      {
        "productId": "uuid",
        "description": "Product Name",
        "quantity": 2,
        "unit": "pcs"
      }
    ],
    "tenantId": "tenant-id"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Publishing Events

The Delivery Service publishes the following events to RabbitMQ:

#### 1. `delivery.created`

Published when a delivery note is created.

```json
{
  "eventType": "delivery.created",
  "data": {
    "deliveryNoteId": "uuid",
    "orderId": "uuid",
    "customerId": "uuid",
    "tenantId": "tenant-id"
  }
}
```

#### 2. `delivery.dispatched`

Published when a delivery is dispatched (carrier assigned, inventory deducted).

```json
{
  "eventType": "delivery.dispatched",
  "data": {
    "deliveryNoteId": "uuid",
    "orderId": "uuid",
    "items": [
      {
        "productId": "uuid",
        "quantity": 2
      }
    ],
    "trackingNumber": "TRACK123",
    "carrierId": "uuid",
    "tenantId": "tenant-id"
  }
}
```

#### 3. `delivery.confirmed`

Published when a delivery is confirmed (delivered).

```json
{
  "eventType": "delivery.confirmed",
  "data": {
    "deliveryNoteId": "uuid",
    "orderId": "uuid",
    "customerId": "uuid",
    "proofOfDeliveryUrl": "https://...",
    "tenantId": "tenant-id"
  }
}
```

## REST API Integration

### Creating Delivery Notes Manually

If you need to create a delivery note manually (outside of event-driven flow):

```bash
POST /api/delivery-notes
Content-Type: application/json
x-tenant-id: your-tenant-id
Authorization: Bearer your-jwt-token

{
  "orderId": "uuid",
  "customerId": "uuid",
  "deliveryAddressId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "description": "Product Name",
      "quantity": 2,
      "unit": "pcs"
    }
  ]
}
```

### Dispatching Deliveries

To dispatch a delivery (triggers carrier API and inventory deduction):

```bash
PUT /api/delivery-notes/{id}/dispatch
Content-Type: application/json
x-tenant-id: your-tenant-id

{
  "carrierId": "uuid"
}
```

This will:
1. Create shipment via carrier API
2. Get tracking number
3. Deduct inventory from Inventory Service
4. Update delivery note status to DISPATCHED
5. Publish `delivery.dispatched` event

### Confirming Deliveries

To confirm a delivery with proof of delivery:

```bash
POST /api/delivery-notes/{id}/confirm
Content-Type: multipart/form-data
x-tenant-id: your-tenant-id

{
  "proofOfDelivery": <file>
}
```

Or with URL:

```bash
POST /api/delivery-notes/{id}/confirm
Content-Type: application/json
x-tenant-id: your-tenant-id

{
  "proofOfDeliveryUrl": "https://..."
}
```

## Inventory Service Integration

The Delivery Service integrates with the Inventory Service to deduct stock when deliveries are dispatched.

**Endpoint Called:**

```
POST {INVENTORY_SERVICE_URL}/api/inventory/deduct
Content-Type: application/json
x-tenant-id: tenant-id

{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "tenantId": "tenant-id"
    }
  ]
}
```

**Response Expected:**

```json
{
  "success": true,
  "data": {
    "deductions": [
      {
        "productId": "uuid",
        "previousQuantity": 100,
        "newQuantity": 98
      }
    ]
  }
}
```

If the inventory service is unavailable, the dispatch will continue but a warning will be logged.

## Registry Service Integration

The Delivery Service may need to fetch customer address information from the Registry Service when creating shipments. This integration should be added based on your architecture.

**Example:**

```typescript
const address = await fetch(
  `${REGISTRY_SERVICE_URL}/api/addresses/${deliveryAddressId}`,
  {
    headers: {
      'x-tenant-id': tenantId,
    },
  }
);
```

## CRM/ERP Integration

The Delivery Service emits events that CRM/ERP systems can consume:

- `delivery.created` - New delivery note created
- `delivery.dispatched` - Shipment dispatched
- `delivery.confirmed` - Delivery confirmed

Subscribe to these events in your CRM/ERP system to:
- Update customer records
- Generate invoices
- Update order status
- Trigger notifications

## Webhook Support (Optional)

To receive webhook notifications from carriers, add webhook endpoints to your routes:

```typescript
router.post('/webhooks/carrier/:carrierId', async (req, res) => {
  const { trackingNumber, status } = req.body;
  // Update delivery note status based on carrier webhook
});
```

## Error Handling

All API calls include proper error handling:

- **400 Bad Request** - Validation errors
- **401 Unauthorized** - Missing or invalid tenant ID / JWT
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Unexpected errors
- **503 Service Unavailable** - External service unavailable

Error response format:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "statusCode": 400
  }
}
```

## Authentication

All endpoints require:
1. **Tenant ID** in header: `x-tenant-id: tenant-id`
2. **JWT Token** in header: `Authorization: Bearer token` (if auth middleware is enabled)

## Testing Integration

1. **Start RabbitMQ:**
```bash
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

2. **Publish test event:**
```bash
# Using RabbitMQ Management UI or CLI tool
# Topic: order-events
# Routing Key: order.fulfilled
```

3. **Verify delivery note created:**
```bash
GET /api/delivery-notes?orderId={orderId}
```

## Best Practices

1. **Idempotency** - Ensure events are idempotent. Delivery Service checks for existing delivery notes before creating new ones.

2. **Error Recovery** - Implement retry logic for failed API calls to Inventory Service.

3. **Monitoring** - Monitor RabbitMQ queues and delivery note statuses.

4. **Logging** - All events and API calls are logged for debugging.

5. **Tenant Isolation** - Always include tenant ID in all requests.

