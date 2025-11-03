# Authentication Centralization - Implementation Summary

## What Was Done

### ✅ 1. Kong Gateway Configuration

**File**: `infrastructure/kong/kong.yml`

- ✅ Added JWT plugin to all services (token verification)
- ✅ Configured request-transformer to inject identity headers:
  - `X-User-Id`: User identifier
  - `X-Tenant-Id`: Tenant identifier
  - `X-User-Email`: User email
  - `X-User-Roles`: User roles
  - `X-User-Scopes`: OAuth2 scopes
- ✅ Added OIDC plugin configuration (commented out, ready for provider)
- ✅ Updated CORS to allow identity headers

**File**: `infrastructure/docker-compose.yml`

- ✅ Added `oidc` to `KONG_PLUGINS` environment variable

### ✅ 2. Shared Identity Middleware

**Location**: `services/shared/identity-middleware/`

Created reusable identity middleware package that:
- Extracts identity from Kong headers
- Validates required headers
- Supports feature toggles for gradual rollout
- Provides hybrid mode (supports both Kong headers and JWT)

### ✅ 3. Service Migration: orders-service

**Files Created**:
- `services/orders-service/src/middleware/identity.middleware.ts`

**Files Modified**:
- `services/orders-service/src/routes/order.routes.ts`: Added feature toggle logic
- `services/orders-service/src/middleware/tenant.middleware.ts`: Updated to work with identity middleware

**Feature Toggle**:
- Environment variable: `USE_KONG_AUTH`
  - `false` (default): Hybrid mode - supports both Kong headers and direct JWT
  - `true`: Kong-only mode - only accepts requests via Kong Gateway

### ✅ 4. Documentation

- ✅ Created `AUTH_MIGRATION_GUIDE.md`: Complete migration guide
- ✅ Updated `IMPROVEMENT_RECOMMENDATIONS.md`: Status tracking

## How It Works

### Request Flow (New)

```
Client → Kong Gateway → Service
         ↓
   1. JWT/OIDC verification
   2. Extract claims
   3. Inject headers (X-User-Id, X-Tenant-Id, etc.)
         ↓
   4. Forward request with headers
         ↓
   Service reads headers (no JWT verification)
```

### Feature Toggle Behavior

**USE_KONG_AUTH=false** (Hybrid Mode):
- Request via Kong → Uses headers from Kong
- Direct request → Falls back to JWT verification
- ✅ Safe for gradual rollout
- ✅ Zero downtime migration

**USE_KONG_AUTH=true** (Kong-Only Mode):
- Request via Kong → Uses headers from Kong
- Direct request → Rejected (401 Unauthorized)
- ✅ Production-ready
- ⚠️ Requires all traffic through Kong

## Next Steps

### To What-If Other Services:

1. **Copy identity middleware**:
   ```bash
   cp services/orders-service/src/middleware/identity.middleware.ts \
      services/<service-name>/src/middleware/identity.middleware.ts
   ```

2. **Update routes file**:
   ```typescript
   import { identityMiddleware, hybridIdentityMiddleware } from '../middleware/identity.middleware';
   import { authMiddleware } from '../middleware/auth.middleware';
   
   const USE_KONG_AUTH = process.env.USE_KONG_AUTH === 'true';
   
   if (USE_KONG_AUTH) {
     router.use(identityMiddleware({ enabled: true }));
   } else {
     router.use(hybridIdentityMiddleware(authMiddleware));
     router.use('(tenantMiddleware)'); // If still needed
   }
   ```

3. **Update tenant middleware** (if exists):
   ```typescript
   const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string || 'default-tenant';
   ```

4. **Test**:
   - Deploy with `USE_KONG_AUTH=false`
   - Test via Kong and direct access
   - Switch to `USE_KONG_AUTH=true` when ready

### To Enable OIDC:

1. Deploy OIDC provider (e.g., Keycloak)
2. Uncomment OIDC plugin in `kong.yml`
3. Set environment variables:
   ```bash
   KONG_OIDC_ISSUER=https://auth.collector.local/realms/collector
   KONG_OIDC_CLIENT_ID=collector-api
   KONG_OIDC_CLIENT_SECRET=<secret>
   KONG_OIDC_SESSIONS_SECRET=<session-secret>
   ```
4. Restart Kong

## Status

| Component | Status | Notes |
|-----------|--------|-------|
| Kong JWT Plugin | ✅ Complete | All services configured |
| Kong Header Injection | ✅ Complete | Request-transformer configured |
| Kong OIDC Plugin | 🚧 Ready | Commented out, needs provider |
| orders-service | ✅ Complete | Hybrid mode implemented |
| registry-service | ⏳ Pending | Template ready |
| invoices-service | ⏳ Pending | Template ready |
| delivery-service | ⏳ Pending | Template ready |
| offers-service | ⏳ Pending | Template ready |
| Other services | ⏳ Pending | Template ready |

## Testing

### Test Kong Header Injection:

```bash
# Via Kong (should inject headers)
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/orders

# Check service logs - should see X-User-Id, X-Tenant-Id headers
```

### Test Hybrid Mode:

```bash
# Direct request (should use JWT)
curl -H "Authorization: Bearer <token>" \
     http://localhost:3003/api/orders

# Via Kong (should use headers)
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/orders
```

### Test Kong-Only Mode:

```bash
# Set USE_KONG_AUTH=true

# Via Kong (should work)
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/orders

# Direct request (should fail with 401)
curl -H "Authorization: Bearer <token>" \
     http://localhost:3003/api/orders
```

## Troubleshooting

See `AUTH_MIGRATION_GUIDE.md` for detailed troubleshooting section.

## Benefits

1. ✅ **Centralized Auth**: Single point of authentication/authorization
2. ✅ **Consistency**: All services use same auth policy
3. ✅ **Performance**: Token verified once at gateway, not per-service
4. ✅ **Security**: Centralized token management and revocation
5. ✅ **Scalability**: Easy to add new services without auth code
6. ✅ **Gradual Migration**: Feature toggle allows zero-downtime rollout

