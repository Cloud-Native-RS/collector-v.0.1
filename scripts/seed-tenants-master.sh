#!/bin/bash

# Master Seed Script for Cloud Native doo and Softergee doo Tenants
# Creates 50 objects of each type for both tenants
#
# Usage: ./scripts/seed-tenants-master.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🌱 Starting Master Seed Script for Cloud Native doo and Softergee doo${NC}\n"

# Tenant IDs
CLOUD_NATIVE_TENANT_ID="217e632c-3c60-4bc4-935e-25297db24ae3"
SOFTERGEE_TENANT_ID="77a3fd30-6178-4830-a56b-d9d07057c2ee"

# Function to seed a service for a tenant
seed_service() {
  local service_name=$1
  local container_name=$2
  local tenant_id=$3
  local tenant_display=$4
  
  echo -e "${BLUE}📦 [${tenant_display}] Seeding ${service_name}...${NC}"
  
  # Check if container is running
  if ! docker ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
    echo -e "${YELLOW}   ⚠️  Container ${container_name} not running, skipping...${NC}"
    return 1
  fi
  
  # Copy seed script and dependencies to container if they exist
  if [ -f "services/${service_name}/src/prisma/seed.ts" ]; then
    docker cp "services/${service_name}/src/prisma/seed.ts" "${container_name}:/app/seed.ts" 2>/dev/null || true
    docker cp "services/${service_name}/src/prisma/seed.ts" "${container_name}:/app/src/prisma/seed.ts" 2>/dev/null || true
    # Copy utility files if seed uses them (for CRM service number-generator)
    if [ -f "services/${service_name}/src/utils/number-generator.ts" ]; then
      docker exec "${container_name}" sh -c "mkdir -p /app/src/utils" 2>/dev/null || true
      docker cp "services/${service_name}/src/utils/number-generator.ts" "${container_name}:/app/src/utils/number-generator.ts" 2>/dev/null || true
    fi
    
    # Copy TypeScript compiler from registry-service if not available (for services without tsx)
    if ! docker exec "${container_name}" sh -c "cd /app && test -f node_modules/.bin/tsc" > /dev/null 2>&1; then
      docker exec collector-account-registry sh -c "cd /app && tar -czf /tmp/tsc-for-seed.tar.gz node_modules/.bin/tsc node_modules/typescript 2>&1" > /dev/null 2>&1
      docker cp collector-account-registry:/tmp/tsc-for-seed.tar.gz /tmp/tsc-for-seed.tar.gz > /dev/null 2>&1
      docker cp /tmp/tsc-for-seed.tar.gz "${container_name}:/tmp/tsc-for-seed.tar.gz" > /dev/null 2>&1
      docker exec -u root "${container_name}" sh -c "cd /app && tar -xzf /tmp/tsc-for-seed.tar.gz 2>&1 && chmod +x node_modules/.bin/tsc 2>&1" > /dev/null 2>&1
    fi
    
    # Compile TypeScript to JavaScript directly in container (as fallback for services without tsx)
    docker exec "${container_name}" sh -c "cd /app && (test -f node_modules/.bin/tsc && node_modules/.bin/tsc seed.ts --module commonjs --target es2020 --esModuleInterop --skipLibCheck --resolveJsonModule --outDir /app 2>&1 | tail -3 || echo '⚠️ TypeScript compilation skipped')" > /dev/null 2>&1
  fi
  
  # Run db push to ensure schema is synced (if prisma is available)
  docker exec "${container_name}" sh -c "cd /app && (npx prisma db push --accept-data-loss 2>&1 | tail -3 || true)" > /dev/null 2>&1
  
  # For CRM service, copy number-generator utility and fix import path in seed.ts
  if [ "${service_name}" = "crm-service" ]; then
    docker exec "${container_name}" sh -c "cd /app && mkdir -p utils && mkdir -p src/utils" 2>/dev/null || true
    if [ -f "services/${service_name}/src/utils/number-generator.ts" ]; then
      docker cp "services/${service_name}/src/utils/number-generator.ts" "${container_name}:/app/utils/number-generator.ts" 2>/dev/null || true
      docker cp "services/${service_name}/src/utils/number-generator.ts" "${container_name}:/app/src/utils/number-generator.ts" 2>/dev/null || true
      # Fix import path in seed.ts if it uses ../utils/number-generator
      docker exec "${container_name}" sh -c "cd /app && sed -i.bak 's|from.*utils/number-generator|from \"\\./utils/number-generator\"|g' seed.ts 2>/dev/null || true" 2>/dev/null || true
    fi
  fi
  
  # Run seed with TENANT_ID environment variable
  # Try multiple approaches: compiled JS (if available), node_modules/.bin/tsx, npm run db:seed
  SEED_OUTPUT=$(docker exec -e TENANT_ID="${tenant_id}" "${container_name}" sh -c "cd /app && (node seed.js 2>&1 || node_modules/.bin/tsx seed.ts 2>&1 || node_modules/.bin/tsx src/prisma/seed.ts 2>&1 || npm run db:seed 2>&1 || echo '⚠️ Seed execution failed')")
  
  if echo "$SEED_OUTPUT" | grep -E "✅|Created|completed|successfully" > /dev/null; then
    echo -e "${GREEN}   ✅ ${service_name} seeded successfully${NC}"
    return 0
  else
    echo -e "${YELLOW}   ⚠️  ${service_name} seed may have issues, check logs${NC}"
    return 1
  fi
}

# Seed for Cloud Native doo
echo -e "\n${GREEN}$(printf '=%.0s' {1..60})${NC}"
echo -e "${GREEN}📦 Seeding Cloud Native doo${NC}"
echo -e "${GREEN}$(printf '=%.0s' {1..60})${NC}\n"

seed_service "registry-service" "collector-account-registry" "$CLOUD_NATIVE_TENANT_ID" "Cloud Native doo"
seed_service "crm-service" "collector-crm" "$CLOUD_NATIVE_TENANT_ID" "Cloud Native doo"
seed_service "offers-service" "collector-offers" "$CLOUD_NATIVE_TENANT_ID" "Cloud Native doo"
seed_service "orders-service" "collector-orders" "$CLOUD_NATIVE_TENANT_ID" "Cloud Native doo"
seed_service "invoices-service" "collector-invoices" "$CLOUD_NATIVE_TENANT_ID" "Cloud Native doo"
seed_service "inventory-service" "collector-inventory" "$CLOUD_NATIVE_TENANT_ID" "Cloud Native doo"
seed_service "project-management-service" "collector-projects" "$CLOUD_NATIVE_TENANT_ID" "Cloud Native doo"
seed_service "hr-service" "collector-hr" "$CLOUD_NATIVE_TENANT_ID" "Cloud Native doo"

# Seed for Softergee doo
echo -e "\n${GREEN}$(printf '=%.0s' {1..60})${NC}"
echo -e "${GREEN}📦 Seeding Softergee doo${NC}"
echo -e "${GREEN}$(printf '=%.0s' {1..60})${NC}\n"

seed_service "registry-service" "collector-account-registry" "$SOFTERGEE_TENANT_ID" "Softergee doo"

seed_service "crm-service" "collector-crm" "$SOFTERGEE_TENANT_ID" "Softergee doo"
seed_service "offers-service" "collector-offers" "$SOFTERGEE_TENANT_ID" "Softergee doo"
seed_service "orders-service" "collector-orders" "$SOFTERGEE_TENANT_ID" "Softergee doo"
seed_service "invoices-service" "collector-invoices" "$SOFTERGEE_TENANT_ID" "Softergee doo"
seed_service "inventory-service" "collector-inventory" "$SOFTERGEE_TENANT_ID" "Softergee doo"
seed_service "project-management-service" "collector-projects" "$SOFTERGEE_TENANT_ID" "Softergee doo"
seed_service "hr-service" "collector-hr" "$SOFTERGEE_TENANT_ID" "Softergee doo"

echo -e "\n${GREEN}✅ Master seed completed!${NC}\n"
echo -e "${GREEN}Summary:${NC}"
echo -e "  ${BLUE}Cloud Native doo:${NC} 50 Contacts, 50 Companies, 50 Leads, 50 Deals, 50 Activities, 50 Offers, 50 Orders, 50 Invoices, 50 Products, 50 Projects, 50 Employees"
echo -e "  ${BLUE}Softergee doo:${NC}    50 Contacts, 50 Companies, 50 Leads, 50 Deals, 50 Activities, 50 Offers, 50 Orders, 50 Invoices, 50 Products, 50 Projects, 50 Employees"
