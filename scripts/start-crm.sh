#!/bin/bash

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
  print_error "Docker is not installed or not in PATH"
  exit 1
fi

# Use docker compose (newer) or docker-compose (older)
if command -v docker &> /dev/null && docker compose version &> /dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
else
  DOCKER_COMPOSE="docker-compose"
fi

print_info "Starting CRM service..."
print_info "This will start the CRM service on port 3009"

cd "$(dirname "$0")/.."

# Start CRM service
if $DOCKER_COMPOSE up -d collector-crm; then
  print_success "CRM service started successfully"
  print_info "Waiting for service to be healthy..."
  
  # Wait for service to be healthy
  MAX_ATTEMPTS=30
  ATTEMPT=1
  
  while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if curl -f -s "http://localhost:3009/health" > /dev/null 2>&1; then
      print_success "CRM service is healthy and ready!"
      print_info "Service is available at: http://localhost:3009"
      exit 0
    fi
    
    echo -n "."
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
  done
  
  print_warning "CRM service started but health check timed out"
  print_info "Check logs with: $DOCKER_COMPOSE logs -f collector-crm"
else
  print_error "Failed to start CRM service"
  exit 1
fi

