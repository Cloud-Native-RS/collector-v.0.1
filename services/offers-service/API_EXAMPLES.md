# API Examples

This document provides example API calls for the Offers Service.

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

The JWT token should contain:
- `userId`: User ID
- `tenantId`: Tenant ID
- `role`: User role

## Create Offer

```bash
curl -X POST http://localhost:3002/api/offers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "validUntil": "2024-02-15T00:00:00Z",
    "currency": "USD",
    "notes": "Q1 2024 Proposal",
    "lineItems": [
      {
        "productId": "product-123",
        "description": "Enterprise License",
        "quantity": 10,
        "unitPrice": 1000,
        "discountPercent": 10,
        "taxPercent": 8.5
      },
      {
        "description": "Setup Service",
        "quantity": 1,
        "unitPrice": 500,
        "discountPercent": 0,
        "taxPercent": 8.5
      }
    ]
  }'
```

## Get Offer

```bash
curl -X GET http://localhost:3002/api/offers/{offer-id} \
  -H "Authorization: Bearer <token>"
```

## List Offers

```bash
# List all offers
curl -X GET "http://localhost:3002/api/offers?limit=20&offset=0" \
  -H "Authorization: Bearer <token>"

# Filter by status
curl -X GET "http://localhost:3002/api/offers?status=SENT&limit=20" \
  -H "Authorization: Bearer <token>"

# Filter by customer and date range
curl -X GET "http://localhost:3002/api/offers?customerId=550e8400-e29b-41d4-a716-446655440000&dateFrom=2024-01-01T00:00:00Z&dateTo=2024-12-31T23:59:59Z" \
  -H "Authorization: Bearer <token>"
```

## Update Offer

```bash
curl -X PUT http://localhost:3002/api/offers/{offer-id} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Updated notes",
    "validUntil": "2024-03-15T00:00:00Z"
  }'
```

## Send Offer

```bash
curl -X POST http://localhost:3002/api/offers/{offer-id}/send \
  -H "Authorization: Bearer <token>"
```

## Approve Offer

```bash
curl -X POST http://localhost:3002/api/offers/{offer-id}/approve \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "approverEmail": "customer@example.com",
    "comments": "Approved by customer"
  }'
```

## Reject Offer

```bash
curl -X POST http://localhost:3002/api/offers/{offer-id}/reject \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "approverEmail": "customer@example.com",
    "comments": "Price too high"
  }'
```

## Approve/Reject by Token (Public Endpoint)

```bash
curl -X POST http://localhost:3002/api/approvals/{approval-token} \
  -H "Content-Type: application/json" \
  -d '{
    "approverEmail": "customer@example.com",
    "approved": true,
    "comments": "Accepted"
  }'
```

## Clone Offer

```bash
curl -X POST http://localhost:3002/api/offers/{offer-id}/clone \
  -H "Authorization: Bearer <token>"
```

## Add Line Item

```bash
curl -X POST http://localhost:3002/api/offers/{offer-id}/line-items \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-456",
    "description": "Additional Service",
    "quantity": 5,
    "unitPrice": 200,
    "discountPercent": 5,
    "taxPercent": 8.5
  }'
```

## Update Line Item

```bash
curl -X PUT http://localhost:3002/api/offers/{offer-id}/line-items/{line-item-id} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 8,
    "discountPercent": 15
  }'
```

## Delete Line Item

```bash
curl -X DELETE http://localhost:3002/api/offers/{offer-id}/line-items/{line-item-id} \
  -H "Authorization: Bearer <token>"
```

## Lookup Customer Offers

```bash
# All offers for customer
curl -X GET "http://localhost:3002/api/offers/lookup?customerId=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>"

# Active offers only
curl -X GET "http://localhost:3002/api/offers/lookup?customerId=550e8400-e29b-41d4-a716-446655440000&activeOnly=true" \
  -H "Authorization: Bearer <token>"
```

## Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }  // Optional, for list endpoints
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "statusCode": 400
  }
}
```

