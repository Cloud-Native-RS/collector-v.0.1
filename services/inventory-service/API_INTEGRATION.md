# Inventory Service - API Integration Guide

Complete reference for integrating with the Inventory & Product Management Service.

## Base URL

```
http://localhost:3002
```

## Authentication

All requests require:
1. **Tenant ID** header: `x-tenant-id: your-tenant-id`
2. **Authorization** header (optional for development): `Bearer <JWT_TOKEN>`

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

## API Endpoints

### Products

#### Create Product
```bash
POST /api/products
Content-Type: application/json
x-tenant-id: default-tenant

{
  "sku": "LAPTOP-001",
  "name": "Dell Laptop XPS 13",
  "description": "High-performance laptop",
  "unitOfMeasure": "PIECE",
  "price": 1299.99,
  "taxPercent": 20,
  "category": "ELECTRONICS"
}
```

#### List Products
```bash
GET /api/products?skip=0&take=50&category=ELECTRONICS&search=laptop
x-tenant-id: default-tenant
```

#### Get Product by SKU
```bash
GET /api/products/sku/LAPTOP-001
x-tenant-id: default-tenant
```

### Warehouses

#### Create Warehouse
```bash
POST /api/warehouses
Content-Type: application/json
x-tenant-id: default-tenant

{
  "name": "Main Warehouse",
  "location": "123 Industrial Blvd, New York, NY",
  "capacity": 10000,
  "status": "ACTIVE"
}
```

#### List Warehouses with Stock
```bash
GET /api/warehouses?includeStock=true
x-tenant-id: default-tenant
```

### Stock Management

#### Check Stock Availability
```bash
GET /api/stock/check?productId=<uuid>&warehouseId=<uuid>
x-tenant-id: default-tenant
```

Response:
```json
{
  "success": true,
  "data": {
    "product": { ... },
    "warehouse": { ... },
    "quantityAvailable": 50,
    "reservedQuantity": 5,
    "availableForOrder": 45,
    "minimumThreshold": 10,
    "reorderLevel": 15
  }
}
```

#### Reserve Stock for Order
```bash
POST /api/stock/reserve
Content-Type: application/json
x-tenant-id: default-tenant

{
  "productId": "<uuid>",
  "warehouseId": "<uuid>",
  "quantity": 5
}
```

#### Unreserve Stock
```bash
POST /api/stock/unreserve
Content-Type: application/json
x-tenant-id: default-tenant

{
  "productId": "<uuid>",
  "warehouseId": "<uuid>",
  "quantity": 5
}
```

#### Adjust Stock
```bash
POST /api/stock/adjust
Content-Type: application/json
x-tenant-id: default-tenant

{
  "productId": "<uuid>",
  "warehouseId": "<uuid>",
  "quantity": 10,
  "transactionType": "IN",  // IN, OUT, ADJUSTMENT, TRANSFER
  "referenceId": "optional-reference-id",
  "notes": "Manual adjustment"
}
```

### Purchase Orders

#### Create Purchase Order
```bash
POST /api/purchase-orders
Content-Type: application/json
x-tenant-id: default-tenant

{
  "supplierId": "<uuid>",
  "status": "DRAFT",
  "expectedDate": "2024-12-31T00:00:00Z",
  "notes": "Urgent order",
  "lineItems": [
    {
      "productId": "<uuid>",
      "quantity": 20,
      "unitPrice": 1100.00
    }
  ]
}
```

#### Receive Purchase Order Items
```bash
POST /api/purchase-orders/<po-id>/receive
Content-Type: application/json
x-tenant-id: default-tenant

{
  "lineItems": [
    {
      "id": "<line-item-id>",
      "receivedQuantity": 20
    }
  ]
}
```

#### Get Purchase Orders by Supplier
```bash
GET /api/purchase-orders?supplierId=<uuid>&status=SENT
x-tenant-id: default-tenant
```

### Delivery Sync

#### Sync Delivery Note
```bash
POST /api/delivery-sync
Content-Type: application/json
x-tenant-id: default-tenant

{
  "deliveryNoteId": "DN-2024-001",
  "productId": "<uuid>",
  "quantity": 10,
  "warehouseId": "<uuid>",
  "transactionType": "OUT"  // IN or OUT
}
```

## Integration Examples

### Orders Service Integration

#### Step 1: Check Availability
```typescript
const checkAvailability = async (productId: string, warehouseId: string, quantity: number) => {
  const response = await fetch(
    `http://inventory-service:3002/api/stock/check?productId=${productId}&warehouseId=${warehouseId}`,
    {
      headers: { 'x-tenant-id': process.env.TENANT_ID }
    }
  );
  
  const { data } = await response.json();
  return data.availableForOrder >= quantity;
};
```

#### Step 2: Reserve Stock
```typescript
const reserveStock = async (orderId: string, items: OrderItem[]) => {
  for (const item of items) {
    await fetch('http://inventory-service:3002/api/stock/reserve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': process.env.TENANT_ID
      },
      body: JSON.stringify({
        productId: item.productId,
        warehouseId: item.warehouseId,
        quantity: item.quantity
      })
    });
  }
};
```

#### Step 3: Unreserve on Cancel
```typescript
const unreserveStock = async (orderId: string, items: OrderItem[]) => {
  for (const item of items) {
    await fetch('http://inventory-service:3002/api/stock/unreserve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': process.env.TENANT_ID
      },
      body: JSON.stringify({
        productId: item.productId,
        warehouseId: item.warehouseId,
        quantity: item.quantity
      })
    });
  }
};
```

### Delivery Service Integration

```typescript
const syncDeliveryNote = async (deliveryNote: DeliveryNote) => {
  for (const item of deliveryNote.items) {
    await fetch('http://inventory-service:3002/api/delivery-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': process.env.TENANT_ID
      },
      body: JSON.stringify({
        deliveryNoteId: deliveryNote.id,
        productId: item.productId,
        quantity: item.quantity,
        warehouseId: deliveryNote.warehouseId,
        transactionType: 'OUT' // or 'IN' for returns
      })
    });
  }
};
```

## Error Handling

### Common Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (tenant mismatch)
- `404` - Not Found
- `409` - Conflict (duplicate SKU, insufficient stock)
- `500` - Internal Server Error

### Example Error Handling

```typescript
try {
  const response = await fetch('/api/stock/reserve', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Stock reservation failed:', error.error.message);
    // Handle specific error codes
    if (error.error.statusCode === 409) {
      // Insufficient stock
    } else if (error.error.statusCode === 403) {
      // Tenant mismatch
    }
  }
  
  const result = await response.json();
  return result.data;
} catch (error) {
  console.error('Request failed:', error);
  throw error;
}
```

## Rate Limiting

Recommended rate limits per tenant:
- Read operations: 1000 requests/minute
- Write operations: 200 requests/minute

## Best Practices

1. **Always check availability before reserving stock**
2. **Use transactions for multi-step operations**
3. **Handle stock conflicts gracefully with retries**
4. **Cache product information for better performance**
5. **Monitor low stock alerts**
6. **Keep delivery syncs idempotent**

## Testing

Use the provided seed data for testing:
- Products: 4 sample products
- Warehouses: 2 warehouses
- Stock: Pre-populated stock levels
- Suppliers: 2 sample suppliers

## Support

For API issues or questions:
- Review the Swagger documentation: `http://localhost:3002/api-docs`
- Check the architecture guide
- Contact the platform team

