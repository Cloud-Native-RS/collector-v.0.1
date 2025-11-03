# CRM Service API Examples

This document provides practical examples of using the CRM Service API.

## Authentication

All requests require JWT authentication and tenant ID:

```bash
# Set your token and tenant ID
TOKEN="your-jwt-token"
TENANT_ID="default-tenant"
```

## Leads API

### Create a Lead

```bash
curl -X POST http://localhost:3009/api/leads \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john.smith@example.com",
    "phone": "+1-555-0101",
    "company": "Tech Innovations Inc.",
    "source": "WEBSITE",
    "status": "NEW",
    "value": 50000,
    "notes": "Interested in enterprise solutions"
  }'
```

### List Leads

```bash
# Get all leads
curl http://localhost:3009/api/leads \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"

# Filter by status
curl "http://localhost:3009/api/leads?status=QUALIFIED" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"

# Filter by source
curl "http://localhost:3009/api/leads?source=WEBSITE" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"

# Search
curl "http://localhost:3009/api/leads?search=John" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"

# Pagination
curl "http://localhost:3009/api/leads?skip=0&take=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

### Get Lead by ID

```bash
curl http://localhost:3009/api/leads/{leadId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

### Update Lead

```bash
curl -X PUT http://localhost:3009/api/leads/{leadId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "QUALIFIED",
    "value": 60000,
    "notes": "Updated after qualification call"
  }'
```

### Convert Lead to Customer

```bash
curl -X POST http://localhost:3009/api/leads/{leadId}/convert \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "US"
    },
    "taxId": "12-3456789"
  }'
```

### Delete Lead

```bash
curl -X DELETE http://localhost:3009/api/leads/{leadId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

## Tasks API

### Create a Task

```bash
curl -X POST http://localhost:3009/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Follow up with John Smith",
    "description": "Schedule demo call",
    "type": "CALL",
    "priority": "HIGH",
    "dueDate": "2024-12-20T10:00:00Z",
    "leadId": "{leadId}"
  }'
```

### List Tasks

```bash
# Get all tasks
curl http://localhost:3009/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"

# Filter by lead
curl "http://localhost:3009/api/tasks?leadId={leadId}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"

# Filter by status
curl "http://localhost:3009/api/tasks?status=PENDING" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

### Mark Task as Complete

```bash
curl -X PUT http://localhost:3009/api/tasks/{taskId}/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

## Deals API

### Create a Deal

```bash
curl -X POST http://localhost:3009/api/deals \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Enterprise Software License",
    "description": "Multi-year enterprise license",
    "value": 50000,
    "probability": 75,
    "stage": "NEGOTIATION",
    "expectedCloseDate": "2024-12-31T00:00:00Z",
    "leadId": "{leadId}"
  }'
```

### List Deals

```bash
# Get all deals
curl http://localhost:3009/api/deals \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"

# Filter by stage
curl "http://localhost:3009/api/deals?stage=NEGOTIATION" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

### Update Deal Stage

```bash
curl -X PUT http://localhost:3009/api/deals/{dealId}/stage \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "CLOSED_WON"
  }'
```

## Activities API

### Create an Activity

```bash
curl -X POST http://localhost:3009/api/activities \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CALL",
    "title": "Initial discovery call",
    "description": "Discussed company needs",
    "notes": "Very interested in our solution",
    "duration": 30,
    "leadId": "{leadId}"
  }'
```

### List Activities

```bash
# Get all activities for a lead
curl "http://localhost:3009/api/activities?leadId={leadId}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

## Analytics API

### Get Sales Pipeline Statistics

```bash
curl http://localhost:3009/api/analytics/pipeline \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

### Get Leads by Source

```bash
curl http://localhost:3009/api/analytics/leads-by-source \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

### Get Conversion Rate

```bash
curl http://localhost:3009/api/analytics/conversion-rate \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

### Get Deals by Stage

```bash
curl http://localhost:3009/api/analytics/deals-by-stage \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }  // Optional: for paginated responses
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "statusCode": 400
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

