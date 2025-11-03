#!/bin/bash

# Master Seed Script for All Microservices
# This script seeds all microservices databases with comprehensive test data

set -e

echo "🌱 Starting comprehensive mint seeding for all services..."
echo ""

SERVICES_DIR="services"
TENANT_ID="default-tenant"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to seed a service
seed_service() {
    local service_name=$1
    local service_dir="$SERVICES_DIR/$service_name"
    
    if [ ! -d "$service_dir" ]; then
        echo -e "${YELLOW}⚠️  Service $service_name not found, skipping...${NC}"
        return 0
    fi
    
    echo -e "${BLUE}📦 Seeding $service_name...${NC}"
    
    cd "$service_dir"
    
    # Check if package.json has seed script
    if grep -q '"seed"' package.json 2>/dev/null; then
        npm run seed 2>&1 | sed 's/^/  /'
    elif grep -q '"db:seed"' package.json 2>/dev/null; then
        npm run db:seed 2>&1 | sed 's/^/  /'
    elif [ -f "src/prisma/seed.ts" ] || [ -f "prisma/seed.ts" ]; then
        # Run seed directly with ts-node or prisma
        if [ -f "package.json" ] && grep -q "prisma" package.json; then
            npx prisma db seed 2>&1 | sed 's/^/  /' || {
                # Fallback to ts-node if prisma seed doesn't work
                if command -v ts-node &> /dev/null; then
                    ts-node src/prisma/seed.ts 2>&1 | sed 's/^/  /' || ts-node prisma/seed.ts 2>&1 | sed 's/^/  /'
                fi
            }
        fi
    else
        echo -e "${YELLOW}  ⏭️  No seed script found for $service_name${NC}"
    fi
    
    cd - > /dev/null
    echo ""
}

# Seed services in order (dependencies first)
echo -e "${GREEN}=== Phase 1: Core Services ===${NC}"
seed_service "registry-service"

echo -e "${GREEN}=== Phase 2: Product & Inventory ===${NC}"
seed_service "inventory-service"

echo -e "${GREEN}=== Phase 3: Sales & Orders ===${NC}"
seed_service "offers-service"
seed_service "orders-service"

echo -e "${GREEN}=== Phase 4: Billing & Delivery ===${NC}"
seed_service "invoices-service"
seed_service "delivery-service"

echo -e "${GREEN}=== Phase 5: Management ===${NC}"
seed_service "project-management-service"
seed_service "hr-service"

echo -e "${GREEN}=== Phase 6: CRM ===${NC}"
seed_service "crm-service"

echo ""
echo -e "${GREEN}✅ All services seeded successfully!${NC}"
echo ""
echo "📊 Summary:"
echo "  - Registry Service: Customers, Companies, Addresses, Contacts"
echo "  - Inventory Service: Products, Warehouses, Stock, Suppliers, Purchase Orders"
echo "  - Orders Service: Orders with various statuses, Payments, Shipping"
echo "  - Offers Service: Offers"
echo "  - Invoices Service: Invoices, Payments, Tax Configuration"
echo "  - Delivery Service: Carriers, Delivery Notes"
echo "  - Project Management: Projects, Tasks, Milestones, Resources"
echo "  - HR Service: Employees, Attendance, Payroll, Recruiting"
echo "  - CRM Service: Leads, Tasks, Deals, Activities, Sales Pipeline"
echo ""
echo "🧪 You can now test all parts of the application!"

