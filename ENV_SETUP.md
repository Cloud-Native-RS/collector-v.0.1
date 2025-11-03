# Environment Variables Setup

## Quick Start

1. Kopirajte `.env.example` u `.env.local` (ili `.env` za development)
2. Popunite sve potrebne vrednosti
3. Restartujte development server

## Required Environment Variables

### API Service URLs

```bash
# Frontend aplikacija
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend Services (Default portovi)
NEXT_PUBLIC_REGISTRY_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_ORDERS_SERVICE_URL=http://localhost:3002
NEXT_PUBLIC_INVOICES_API_URL=http://localhost:3003
NEXT_PUBLIC_OFFERS_SERVICE_URL=http://localhost:3004
NEXT_PUBLIC_INVENTORY_SERVICE_URL=http://localhost:3005
NEXT_PUBLIC_HR_SERVICE_URL=http://localhost:3006
NEXT_PUBLIC_PROJECT_MANAGEMENT_SERVICE_URL=http://localhost:3007
NEXT_PUBLIC_DELIVERY_SERVICE_URL=http://localhost:3008
NEXT_PUBLIC_CRM_SERVICE_URL=http://localhost:3009
```

### Authentication

```bash
# Auth service URL (može biti isti kao registry service)
NEXT_PUBLIC_AUTH_URL=http://localhost:3001

# Enable real auth service (set to 'true' when auth service is ready)
NEXT_PUBLIC_USE_REAL_AUTH=false

# JWT Configuration (za backend servise)
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Mock token for development (optional)
NEXT_PUBLIC_MOCK_TOKEN=mock-token-for-development
```

**Note**: 
- Set `NEXT_PUBLIC_USE_REAL_AUTH=true` kada je auth service spreman
- U development modu, ako real auth ne radi, automatski koristi mock implementaciju
- U production modu, real auth je obavezan

### Tenant Configuration

```bash
NEXT_PUBLIC_DEFAULT_TENANT_ID=default-tenant
```

## Development vs Production

### Development
- Sve `NEXT_PUBLIC_*` varijable se učitavaju u browser
- Koristite `.env.local` (ignorisan od git-a)
- Default vrednosti su podešene u kodu

### Production
- Koristite environment variables na hosting platformi
- **NIKAD** ne commit-ujte `.env.local` sa stvarnim vrednostima
- Koristite secrets management (Vercel, AWS Secrets Manager, itd.)

## Note

`.env.example` fajl je template - kopirajte ga i popunite sa svojim vrednostima.

