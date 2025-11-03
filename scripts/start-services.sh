#!/bin/bash

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service definitions
SERVICES=(
  "registry-service:3001"
  "invoices-service:3002"
  "crm-service:3009"
)

# Helper functions for colored output
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

print_loading() {
  echo -e "${BLUE}⟳${NC} $1"
}

# Function to check if service is healthy
check_service_health() {
  local service_url=$1
  local service_name=$2
  local max_attempts=30
  local attempt=1
  local wait_time=2

  print_loading "Checking $service_name health..."

  while [ $attempt -le $max_attempts ]; do
    if curl -f -s "${service_url}/health" > /dev/null 2>&1; then
      print_success "$service_name is healthy ✓"
      return 0
    fi

    if [ $attempt -lt $max_attempts ]; then
      printf "\r${BLUE}⟳${NC} Waiting for $service_name... (attempt $attempt/$max_attempts)   "
      sleep $wait_time
    fi
    attempt=$((attempt + 1))
  done
  printf "\n"
  
  print_error "$service_name is not responding after $max_attempts attempts"
  return 1
}

# Function to start docker-compose service
start_docker_service() {
  local service_dir=$1
  local service_name=$2

  print_info "Starting $service_name..."

  if [ ! -d "$service_dir" ]; then
    print_error "Service directory not found: $service_dir"
    return 1
  fi

  cd "$service_dir" || return 1

  # Check if docker-compose is running
  if docker-compose ps | grep -q "Up"; then
    print_warning "$service_name is already running"
    cd - > /dev/null || return 1
    return 0
  fi

  # Start the service
  if docker-compose up -d > /dev/null 2>&1; then
    print_success "$service_name docker containers started"
    cd - > /dev/null || return 1
    return 0
  else
    print_error "Failed to start $service_name docker containers"
    cd - > /dev/null || return 1
    return 1
  fi
}

# Function to wait for database migrations
wait_for_migrations() {
  local service_dir=$1
  local service_name=$2

  print_info "Waiting for $service_name migrations..."

  cd "$service_dir" || return 1

  # Wait for service to be ready
  sleep 5

  # Run migrations
  if docker-compose exec -T $(docker-compose ps -q 2>/dev/null | head -1) npm run db:migrate:deploy > /dev/null 2>&1; then
    print_success "$service_name migrations completed"
    cd - > /dev/null || return 1
    return 0
  else
    print_warning "$service_name migrations may have failed (this is OK if already migrated)"
    cd - > /dev/null || return 1
    return 0
  fi
}

# Main execution
main() {
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}   Starting Collector Platform Services${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo ""

  local failed_services=()
  local service_map=(
    "registry-service:services/registry-service"
    "invoices-service:services/invoices-service"
    "crm-service:services/crm-service"
  )

  # Start all services
  for service_entry in "${service_map[@]}"; do
    IFS=':' read -r service_name service_dir <<< "$service_entry"
    
    print_info "Processing $service_name..."
    
    if ! start_docker_service "$service_dir" "$service_name"; then
      failed_services+=("$service_name (docker start)")
      continue
    fi

    if ! wait_for_migrations "$service_dir" "$service_name"; then
      # Continue anyway - migrations might be OK if already applied
      print_warning "$service_name migrations may have failed (continuing anyway)"
    fi
  done

  echo ""
  print_info "Waiting for services to be ready..."
  sleep 5

  # Check health of all services
  echo ""
  print_info "Checking service health..."
  echo ""

  for service_entry in "${SERVICES[@]}"; do
    IFS=':' read -r service_name service_port <<< "$service_entry"
    service_url="http://localhost:$service_port"
    
    if ! check_service_health "$service_url" "$service_name"; then
      failed_services+=("$service_name (health check)")
    fi
  done

  # Final summary
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  
  if [ ${#failed_services[@]} -eq 0 ]; then
    echo -e "${GREEN}   ✓ All services are running successfully!${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
    print_success "Registry Service: http://localhost:3001"
    print_success "Invoices Service: http://localhost:3002"
    print_success "CRM Service: http://localhost:3009"
    echo ""
    print_info "You can now access the dashboard at http://localhost:3000"
    return 0
  else
    echo -e "${RED}   ✗ Some services failed to start${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
    print_error "Failed services:"
    for service in "${failed_services[@]}"; do
      echo -e "  ${RED}•${NC} $service"
    done
    echo ""
    print_info "Troubleshooting:"
    echo "  1. Check if Docker is running: docker ps"
    echo "  2. Check service logs: cd services/<service-name> && docker-compose logs"
    echo "  3. Check service status: cd services/<service-name> && docker-compose ps"
    echo "  4. Restart a service: cd services/<service-name> && docker-compose restart"
    return 1
  fi
}

# Run main function
main "$@"

