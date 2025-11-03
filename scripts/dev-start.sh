#!/bin/bash

# Collector Platform - Development Start Script
set -e

echo "🚀 Starting Collector Platform..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first."
    exit 1
fi

# Use docker compose (v2) if available, otherwise docker-compose (v1)
COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
    COMPOSE_CMD="docker-compose"
fi

echo -e "${BLUE}📦 Pulling latest images...${NC}"
$COMPOSE_CMD pull --ignore-pull-failures

echo ""
echo -e "${BLUE}🏗️  Building services...${NC}"
$COMPOSE_CMD build

echo ""
echo -e "${BLUE}🗄️  Setting up databases...${NC}"
# Wait for postgres to be ready
echo "  Waiting for PostgreSQL..."
$COMPOSE_CMD up -d postgres
sleep 5

# Setup databases
if [ -f "scripts/setup-databases.sh" ]; then
    chmod +x scripts/setup-databases.sh
    docker exec -i collector-postgres psql -U collector -d postgres < <(
        cat <<EOF
-- Create all databases
SELECT 'CREATE DATABASE collector_registry_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_registry_db')\gexec
SELECT 'CREATE DATABASE collector_orders_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_orders_db')\gexec
SELECT 'CREATE DATABASE collector_invoices_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_invoices_db')\gexec
SELECT 'CREATE DATABASE collector_offers_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_offers_db')\gexec
SELECT 'CREATE DATABASE collector_inventory_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_inventory_db')\gexec
SELECT 'CREATE DATABASE collector_delivery_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_delivery_db')\gexec
SELECT 'CREATE DATABASE collector_hr_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_hr_db')\gexec
SELECT 'CREATE DATABASE collector_projects_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_projects_db')\gexec
EOF
    ) || echo "  Databases might already exist"
fi

echo ""
echo -e "${BLUE}🚀 Starting all services...${NC}"
$COMPOSE_CMD up -d

echo ""
echo -e "${GREEN}✅ Collector Platform is starting!${NC}"
echo ""
echo -e "${YELLOW}📋 Service URLs:${NC}"
echo "  🌐 Frontend:          http://localhost:3000"
echo "  📊 Registry:          http://localhost:3001"
echo "  📦 Orders:            http://localhost:3002"
echo "  💰 Invoices:          http://localhost:3003"
echo "  🎯 Offers:            http://localhost:3004"
echo "  📚 Inventory:         http://localhost:3005"
echo "  👥 HR:                http://localhost:3006"
echo "  🏗️  Projects:          http://localhost:3007"
echo "  🚚 Delivery:          http://localhost:3008"
echo ""
echo -e "${YELLOW}🗄️  Infrastructure:${NC}"
echo "  🐘 PostgreSQL:        localhost:5432"
echo "  🔴 Redis:             localhost:6379"
echo "  🐰 RabbitMQ:          http://localhost:15672 (Management UI)"
echo ""
echo -e "${YELLOW}📊 Monitor services:${NC}"
echo "  View logs:    $COMPOSE_CMD logs -f [service-name]"
echo "  View all:     $COMPOSE_CMD logs -f"
echo "  Status:       $COMPOSE_CMD ps"
echo "  Stop all:     $COMPOSE_CMD down"
echo ""
echo -e "${BLUE}Waiting for services to be ready...${NC}"
sleep 5

# Check service health
echo ""
echo -e "${BLUE}🏥 Health checks:${NC}"
services=("collector-registry:3001" "collector-orders:3002" "collector-invoices:3003")
for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    if curl -f -s http://localhost:$port/health > /dev/null 2>&1; then
        echo -e "  ✅ $name"
    else
        echo -e "  ⏳ $name (still starting...)"
    fi
done

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"

