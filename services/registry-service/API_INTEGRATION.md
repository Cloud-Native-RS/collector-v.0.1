# API Integration Guide

## Overview

This guide provides comprehensive instructions for integrating the Registry Service API into your applications.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://registry.collector.com` (example)

## Authentication

All API requests require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

Additionally, include the tenant ID in the header:

```bash
x-tenant-id: <your-tenant-id>
```

## Headers

All requests should include:

```bash
Content-Type: application/json
Authorization: Bearer <token>
x-tenant-id: <tenant-id>
```

## Customer Endpoints

### Create Customer

```bash
POST /api/customers
```

**Request Body** (Individual):
```json
{
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
}
```

**Request Body** (Company):
```json
{
  "type": "COMPANY",
  "companyName": "ABC Trading LLC",
  "email": "contact@abctrading.com",
  "phone": "+1-555-0300",
  "taxId": "98-7654321",
  "registrationNumber": "LLC-2024-001",
  "address": {
    "street": "789 Commerce Blvd",
    "city": "Chicago",
    "state": "IL",
    "zipCode": "60601",
    "country": "United States"
  },
  "contact": {
    "email": "contact@abctrading.com",
    "phone": "+1-555-0300"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "type": "INDIVIDUAL",
    "customerNumber": "CUST-7K8M9N2P",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "taxId": "12-3456789",
    "status": "ACTIVE",
    "tenantId": "your-tenant-id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "address": { ... },
    "contact": { ... },
    "bankAccount": { ... }
  }
}
```

### List Customers

```bash
GET /api/customers?skip=0&take=50
```

**Query Parameters**:
- `skip` (optional): Number of records to skip (default: 0)
- `take` (optional): Number of records to return (default: 50, max: 100)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "customerNumber": "CUST-7K8M9N2P",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      ...
    }
  ]
}
```

### Get Customer by ID

```bash
GET /api/customers/:id
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customerNumber": "CUST-7K8M9N2P",
    ...
  }
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "message": "Customer not found",
    "statusCode": 404
  }
}
```

### Update Customer

```bash
PUT /api/customers/:id
```

**Request Body**:
```json
{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "phone": "+1-555-9999"
}
```

### Delete Customer

```bash
DELETE /api/customers/:id
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

## Company Endpoints

### Create Company

```bash
POST /api/companies
```

**Request Body**:
```json
{
  "companyType": "CORPORATION",
  "legalName": "Acme Corporation",
  "tradingName": "Acme Corp",
  "taxId": "45-9876543",
  "registrationNumber": "CORP-2020-045",
  "industry": "Technology",
  "legalRepName": "Jane Smith",
  "legalRepTitle": "CEO",
  "legalRepEmail": "jane.smith@acmecorp.com",
  "legalRepPhone": "+1-555-0250",
  "address": {
    "street": "456 Park Avenue",
    "city": "London",
    "state": null,
    "zipCode": "SW1A 1AA",
    "country": "United Kingdom"
  },
  "contact": {
    "email": "info@acmecorp.com",
    "phone": "+1-555-0200",
    "website": "https://acmecorp.com"
  },
  "bankAccount": {
    "bankName": "Barclays Bank",
    "accountNumber": "9876543210",
    "iban": "GB82WEST12345698765432",
    "swift": "BARCGB22XXX"
  }
}
```

**Response**: Similar to customer creation

### List Companies

```bash
GET /api/companies?skip=0&take=50
```

### Get Company by ID

```bash
GET /api/companies/:id
```

### Update Company

```bash
PUT /api/companies/:id
```

### Delete Company

```bash
DELETE /api/companies/:id
```

## Lookup Endpoints

### Lookup Customer by Tax ID or Email

```bash
GET /api/lookup/customer?taxId=12-3456789
GET /api/lookup/customer?email=john.doe@example.com
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customerNumber": "CUST-7K8M9N2P",
    ...
  }
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "message": "Customer not found",
    "statusCode": 404
  }
}
```

### Lookup Company by Tax ID or Registration Number

```bash
GET /api/lookup/company?taxId=45-9876543
GET /api/lookup/company?registrationNumber=CORP-2020-045
```

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

### Common Error Codes

| Status | Description | Example |
|--------|-------------|---------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry |
| 500 | Internal Server Error | Server error |

### Validation Errors

When validation fails:

```json
{
  "success": false,
  "error": {
    "message": "Invalid Tax ID format (should be XX-XXXXXXX)",
    "statusCode": 400
  }
}
```

## Code Examples

### JavaScript/TypeScript

```typescript
async function createCustomer(data: CustomerData) {
  const response = await fetch('http://localhost:3001/api/customers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-tenant-id': tenantId
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return await response.json();
}
```

### cURL

```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{
    "type": "INDIVIDUAL",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "taxId": "12-3456789",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "United States"
    },
    "contact": {
      "email": "john@example.com"
    }
  }'
```

### Python

```python
import requests

def create_customer(data, token, tenant_id):
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}',
        'x-tenant-id': tenant_id
    }
    
    response = requests.post(
        'http://localhost:3001/api/customers',
        json=data,
        headers=headers
    )
    
    response.raise_for_status()
    return response.json()
```

## Best Practices

### 1. Pagination

Always use pagination for list endpoints:

```typescript
// Fetch first page
const page1 = await getCustomers(0, 50);

// Fetch second page
const page2 = await getCustomers(50, 50);
```

### 2. Error Handling

Always handle errors gracefully:

```typescript
try {
  const customer = await createCustomer(data);
} catch (error) {
  if (error.message.includes('already exists')) {
    // Handle duplicate
  } else if (error.message.includes('not found')) {
    // Handle not found
  } else {
    // Handle other errors
  }
}
```

### 3. Caching

Cache lookup results for performance:

```typescript
const cache = new Map();

async function getCustomerCached(id: string) {
  if (cache.has(id)) {
    return cache.get(id);
  }
  
  const customer = await getCustomer(id);
  cache.set(id, customer);
  return customer;
}
```

### 4. Retry Logic

Implement retry logic for transient errors:

```typescript
async function createCustomerWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await createCustomer(data);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

## Rate Limiting (Future)

The API will implement rate limiting:
- **100 requests per minute** per tenant
- Rate limit headers will be included in responses

## Webhooks (Future)

Subscribe to events:

```bash
POST /api/webhooks
```

Events:
- `customer.created`
- `customer.updated`
- `customer.deleted`
- `company.created`
- `company.updated`
- `company.deleted`

## Support

For issues or questions:
- Email: support@collector.com
- Documentation: https://docs.collector.com
- Status: https://status.collector.com

