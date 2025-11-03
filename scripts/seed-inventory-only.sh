#!/bin/bash
# Seed script samo za inventory-service
# Usage: ./scripts/seed-inventory-only.sh [TENANT_ID]

set -e

echo "🌱 Seeding Inventory Service only..."
echo ""

SERVICE_DIR="services/inventory-service"
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BASE_DIR" || exit 1

if [ ! -d "$SERVICE_DIR" ]; then
    echo "❌ Service directory not found: $SERVICE_DIR"
    exit 1
fi

cd "$SERVICE_DIR"

# Proveri da li postoji package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

# Koristi tenant ID iz argumenta ili environment varijable
TENANT_ID=${1:-${TENANT_ID:-default-tenant}}

if [ -n "$1" ]; then
    export TENANT_ID="$1"
    echo "📋 Using tenant ID: $TENANT_ID"
fi

# Proveri da li Docker kontejner radi
USE_DOCKER=false
if docker ps --format '{{.Names}}' | grep -q "^collector-inventory$"; then
    echo "🐳 Docker container 'collector-inventory' is running"
    USE_DOCKER=true
fi

# Proveri da li postoji seed script
if grep -q '"db:seed"' package.json; then
    echo "📦 Running seed script..."
    
    # Postavi DATABASE_URL za lokalno pokretanje
    DB_URL="postgresql://collector:collector_dev_pass@localhost:5432/collector_inventory_db?schema=public"
    
    if [ "$USE_DOCKER" = true ]; then
        echo "   Attempting through Docker container..."
        # Kopiraj seed fajl u kontejner
        docker cp src/prisma/seed.ts collector-inventory:/app/seed.ts 2>/dev/null || true
        
        # Pokušaj sa node i kompajlovanim fajlom ili direktno
        if docker exec collector-inventory sh -c "cd /app && command -v node > /dev/null && node --version" > /dev/null 2>&1; then
            # Pokušaj da kompajliram TypeScript u JS lokalno pa kopiram
            echo "   ⚠️  Note: tsx is not available in container. Compiling locally..."
            cd "$BASE_DIR"
            
            # Kompajliraj TypeScript
            if command -v npx > /dev/null 2>&1 && [ -f "services/inventory-service/node_modules/.bin/tsc" ]; then
                echo "   📝 Compiling TypeScript..."
                (cd services/inventory-service && npx tsc src/prisma/seed.ts --module commonjs --target es2020 --esModuleInterop --skipLibCheck --resolveJsonModule --moduleResolution node --outDir /tmp/inventory-seed 2>&1 | grep -v "TS" | head -5 || true)
                
                if [ -f "/tmp/inventory-seed/prisma/seed.js" ]; then
                    docker cp /tmp/inventory-seed/prisma/seed.js collector-inventory:/app/seed.js
                    docker exec -e TENANT_ID="$TENANT_ID" collector-inventory sh -c "cd /app && node seed.js" && USE_DOCKER=false || true
                fi
            fi
        fi
    fi
    
    # Ako Docker nije uspeo ili nije dostupan, pokreni lokalno
    if [ "$USE_DOCKER" != "true" ] || [ $? -ne 0 ]; then
        echo "   Running locally with DATABASE_URL..."
        echo "   ⚠️  Compiling TypeScript for Docker execution..."
        cd "$BASE_DIR"
        
        # Kompajliraj seed.ts u JavaScript
        if command -v npx > /dev/null 2>&1 && [ -f "services/inventory-service/node_modules/.bin/tsc" ]; then
            (cd services/inventory-service && npx tsc src/prisma/seed.ts --module commonjs --target es2020 --esModuleInterop --skipLibCheck --resolveJsonModule --moduleResolution node --outDir dist-seed --rootDir src 2>&1 | grep -v "TS" | tail -3 || true)
            
            if [ -f "services/inventory-service/dist-seed/prisma/seed.js" ] && docker ps --format '{{.Names}}' | grep -q "^collector-inventory$"; then
                echo "   📦 Copying compiled seed to Docker container..."
                docker cp services/inventory-service/dist-seed/prisma/seed.js collector-inventory:/app/seed.js
                
                if [ -n "$TENANT_ID" ] && [ "$TENANT_ID" != "default-tenant" ]; then
                    docker exec -e TENANT_ID="$TENANT_ID" collector-inventory sh -c "cd /app && node seed.js"
                else
                    docker exec -e TENANT_ID="default-tenant" collector-inventory sh -c "cd /app && node seed.js"
                fi
            else
                echo "   ⚠️  Could not compile or Docker container not available. Trying local execution..."
                cd "$BASE_DIR/$SERVICE_DIR"
                if [ -n "$TENANT_ID" ] && [ "$TENANT_ID" != "default-tenant" ]; then
                    DATABASE_URL="$DB_URL" TENANT_ID="$TENANT_ID" npm run db:seed
                else
                    DATABASE_URL="$DB_URL" npm run db:seed
                fi
            fi
        else
            cd "$BASE_DIR/$SERVICE_DIR"
            if [ -n "$TENANT_ID" ] && [ "$TENANT_ID" != "default-tenant" ]; then
                DATABASE_URL="$DB_URL" TENANT_ID="$TENANT_ID" npm run db:seed
            else
                DATABASE_URL="$DB_URL" npm run db:seed
            fi
        fi
    fi
else
    echo "❌ No 'db:seed' script found in package.json"
    exit 1
fi

echo ""
echo "✅ Inventory Service seed completed!"
echo "   📦 Products & Services with DevOps/SUSE/RedHat/PostgreSQL services have been added"

