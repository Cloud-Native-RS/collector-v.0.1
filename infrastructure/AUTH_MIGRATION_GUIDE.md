# Authentication Migration Guide

## Overview

This guide documents the migration from per-service JWT authentication to centralized authentication via Kong Gateway with header-based identity propagation.

## Architecture

### Before (Legacy)
- Each service verifies JWT tokens independently
- Duplicated auth logic across services
- No centralized auth policy
- Direct service-to-service calls require token forwarding

### After (Centralized)
- Kong Gateway verifies JWT/OIDC tokens once
- Identity information injected as trusted headers (`X-User-Id`, `X-Tenant-Id`, etc.)
- Services trust headers from Kong (no token verification needed)
- Consistent auth policy across all services

## Migration Steps

### 1. Kong Gateway Configuration

Kong is configured with:
- **JWT Plugin**: Verifies JWT token validity (exp, iat claims)
- **OIDC Plugin**: Ready for OAuth2/OIDC integration (commented out, uncomment when provider is configured)
- **Request Transformer**: Injects identity headers from verified tokens

**Key Headers Injected:**
- `X-User-Id`: User identifier
- `X-Tenant-Id`: Tenant identifier  
- `X-User-Email`: User email (if available)
- `X-User-Roles`: User roles (JSON array or comma-separated)
- `X-User-Scopes`: OAuth2 scopes

**Configuration Files:**
- `infrastructure/kong/kong.yml`: Service routes and plugin configuration
- `infrastructure/docker-compose.yml`: Kong service with OIDC plugin enabled

### 2. Service Migration

Each service can be migrated in three phases:

#### Phase 1: Hybrid Mode (Current)
- Service supports both Kong headers AND direct JWT
- Feature toggle: `USE_KONG_AUTH=false` (default)
- Hybrid middleware detects Kong headers first, falls back to JWT if not present
- **Status**: ✅ Implemented in orders-service

#### Phase 2: Kong-Only Mode
- Service only accepts requests via Kong Gateway
- Feature toggle: `USE_KONG_AUTH=true`
- Identity middleware validates Kong headers only
- **Status**: 🚧 Ready for testing

#### Phase 3: Cleanup
- Remove legacy JWT verification code
- Remove `auth.middleware.ts`
- Simplify tenant middleware
- **Status**: ⏳ Pending full migration

### 3. Feature Toggle

Each service uses environment variable for gradual rollout:

```bash
# Legacy mode (hybrid - supports both)
USE_KONG_AUTH=false

# Kong-only mode (header-based only)
USE_KONG_AUTH=true
```

## Implementation Example: orders-service

### Files Created:
- `services/orders-service/src/middleware/identity.middleware.ts`: New header-based identity middleware

### Files Modified:
- `services/orders-service/src/routes/order.routes.ts`: Added feature toggle logic

### Code Pattern:

```typescript
import { identityMiddleware, hybridIdentityMiddleware } from '../middleware/identity.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const USE_KONG_AUTH = process.env.USE_KONG_AUTH === 'true';

if (USE_KONG_AUTH) {
  // Kong-only: Trust headers from gateway
  router.use(identityMiddleware({ enabled: true }));
} else {
  // Hybrid: Support both Kong headers and direct JWT
  router.use(hybridIdentityMiddleware(authMiddleware));
}
```

## Rollout Plan

### Service-by-Service Migration:

1. ✅ **Kong Gateway**: JWT/OIDC configured, headers injected
2. ✅ **orders-service**: Hybrid mode implemented
3. ⏳ **registry-service**: Pending
4. ⏳ **invoices-service**: Pending
5. ⏳ **delivery-service**: Pending
6. ⏳ **offers-service**: Pending
7. ⏳ **hr-service**: Pending
8. ⏳ **project-management-service**: Pending
9. ⏳ **inventory-service**: Pending

### Testing Checklist:

For each service:
- [ ] Deploy with `USE_KONG_AUTH=false` (hybrid mode)
- [ ] Test requests via Kong Gateway (should use headers)
- [ ] Test direct requests (should fall back to JWT)
- [ ] Verify tenant isolation still works
- [ ] Switch to `USE_KONG_AUTH=true` (Kong-only)
- [ ] Test requests via Kong Gateway (should work)
- [ ] Verify direct requests are rejected (expected)
- [ ] Monitor error rates and performance

## OIDC Provider Setup (Future)

When ready to enable OIDC:

1. **Deploy OIDC Provider** (e.g., Keycloak)
2. **Configure Kong OIDC Plugin**:
   - Uncomment OIDC plugin in `kong.yml`
   - Set environment variables:
     - `KONG_OIDC_ISSUER`
     - `KONG_OIDC_CLIENT_ID`
     - `KONG_OIDC_CLIENT_SECRET`
     - `KONG_OIDC_SESSIONS_SECRET`
3. **Update Request Transformer**:
   - OIDC plugin populates `x_userinfo_*` variables
   - Request transformer extracts these automatically
4. **Test Integration**:
   - Obtain OAuth2 token from provider
   - Send request to Kong with `Authorization: Bearer <token>`
   - Verify headers are injected correctly

## Security Considerations

### Headers Trust Model
- Services **MUST** only accept requests via Kong Gateway
- Direct service access should be restricted (network/firewall)
- Headers are only trusted if coming from Kong's IP/network

### Validation
- Kong validates JWT signature and expiration
- Services validate header presence (not signature - that's Kong's job)
- Tenant isolation enforced via `X-Tenant-Id` header

### Monitoring
- Log authentication failures
- Monitor header presence/missing
- Alert on direct service access attempts

## Troubleshooting

### Issue: "Missing required identity headers"
**Solution**: Request is not coming through Kong Gateway, or Kong JWT/OIDC verification failed

### Issue: "Tenant ID mismatch"
**Solution**: Token/header tenant ID doesn't match. Check Kong transformer configuration.

### Issue: Service-to-service calls failing
**Solution**: Internal service calls should use service mesh mTLS or API keys, not user tokens.

## References

- [Kong JWT Plugin](https://docs.konghq.com/hub/kong-inc/jwt/)
- [Kong OIDC Plugin](https://docs.konghq.com/hub/kong-inc/oidc/)
- [Kong Request Transformer](https://docs.konghq.com/hub/kong-inc/request-transformer/)

