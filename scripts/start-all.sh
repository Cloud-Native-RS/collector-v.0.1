#!/bin/bash

# Start All Services - Infrastructure + Microservices
# This script starts infrastructure first, then microservices

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Starting Collector Platform - Complete Stack${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Start Infrastructure
print_info "Step 1: Starting infrastructure..."
cd infrastructure

if docker-compose up -d > /dev/null 2>&1; then
  print_success "Infrastructure started"
else
  print_error "Failed to start infrastructure"
  print_info "Try running manually: cd infrastructure && docker-compose up -d"
  exit 1
fi

cd ..

# Step 2: Wait for infrastructure
print_info "Waiting for infrastructure to be ready..."
sleep 15

# Step 3: Initialize Kong Services (optional)
print_info "Step 2: Initializing Kong services..."
if [ -f "infrastructure/scripts/init-kong-services.sh" ]; then
  sleep 5
  cd infrastructure && ./scripts/init-kong-services.sh && cd ..
  print_success "Kong services initialized"
else
  print_warning "Kong initialization script not found (skipping)"
fi

# Step 4: Start Microservices
print_info "Step 3: Starting microservices..."
./scripts/start-services.sh

echo ""
print_success "All services started!"
print_info "Access points:"
print_success "  - Dashboard: http://localhost:3000"
print_success "  - API Gateway: http://localhost:8000"
print_success "  - HAProxy: http://localhost:80"
print_success "  - Kong Admin: http://localhost:8001"
print_success "  - Konga UI: http://localhost:1337"
print_info "Microservices:"
print_success "  - Account Registry: http://localhost:3001"
print_success "  - Orders: http://localhost:3002"
print_success "  - Invoices: http://localhost:3003"
print_success "  - Offers: http://localhost:3004"
print_success "  - Inventory: http://localhost:3005"
print_success "  - HR: http://localhost:3006"
print_success "  - Projects: http://localhost:3007"
print_success "  - Delivery: http://localhost:3008"
print_success "  - CRM: http://localhost:3009"

