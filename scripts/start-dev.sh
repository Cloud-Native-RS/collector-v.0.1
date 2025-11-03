#!/bin/bash

# Start Collector Platform - Development Environment
# This script frees occupied ports and starts all services in Docker containers

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Define all ports used by the application
PORTS=(
  # Frontend
  "3000:Next.js Application"
  
  # Microservices
  "3001:Registry Service"
  "3002:Orders Service"
  "3003:Invoices Service"
  "3004:Offers Service"
  "3005:Inventory Service"
  "3006:HR Service"
  "3007:Project Management Service"
  "3008:Delivery Service"
  
  # Infrastructure
  "5432:PostgreSQL"
  "6379:Redis"
  "5672:RabbitMQ AMQP"
  "15672:RabbitMQ Management"
  
  # Optional Infrastructure (if used)
  "80:HAProxy"
  "8000:Kong Gateway"
  "8001:Kong Admin"
  "1337:Konga UI"
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
  echo -e "${CYAN}⟳${NC} $1"
}

# Function to check if port is in use
is_port_in_use() {
  local port=$1
  lsof -ti:$port > /dev/null 2>&1
  return $?
}

# Function to check if process is Docker-related
is_docker_process() {
  local pid=$1
  local process_path=$(ps -p $pid -o command= 2>/dev/null)
  
  if [[ "$process_path" == *"Docker"* ]] || \
     [[ "$process_path" == *"docker"* ]] || \
     [[ "$process_path" == *"com.docker"* ]]; then
    return 0
  fi
  return 1
}

# Function to find Docker container using a port
find_docker_container_by_port() {
  local port=$1
  
  if ! command -v docker &> /dev/null; then
    return 1
  fi
    
  if ! docker info > /dev/null 2>&1; then
    return 1
  fi
    
  # Find container using this port (check published ports)
  local container=$(docker ps --format "{{.Names}}\t{{.Ports}}" 2>/dev/null | \
    grep -E ":$port->|:$port/" | cut -f1 | head -1)
  
  if [ -n "$container" ]; then
    echo "$container"
    return 0
  fi
    
  # Check Collector containers specifically
  container=$(docker ps --filter "label=app=collector" --format "{{.Names}}" 2>/dev/null | \
    while read name; do
      if docker port "$name" 2>/dev/null | grep -q ":$port"; then
        echo "$name"
        break
      fi
    done | head -1)
  
  if [ -n "$container" ]; then
    echo "$container"
    return 0
  fi
    
  return 1
}

# Function to free a port
free_port() {
  local port=$1
  local service_name=$2
  
  if is_port_in_use "$port"; then
    print_warning "Port $port ($service_name) is in use"
    
    # First, try to stop Docker container if Docker is available
    if command -v docker &> /dev/null && docker info > /dev/null 2>&1; then
      local container=$(find_docker_container_by_port "$port")
      if [ -n "$container" ]; then
        print_info "  Found Docker container: $container"
        if docker stop "$container" > /dev/null 2>&1; then
          print_success "  Stopped Docker container: $container"
          sleep 2
          
          # Verify port is now free
          if ! is_port_in_use "$port"; then
            print_success "  Port $port ($service_name) is now free"
            return 0
          fi
        else
          print_warning "  Failed to stop Docker container: $container"
        fi
      fi
    fi
    
    # Get all PIDs using this port
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -z "$pids" ]; then
      print_warning "  Could not find process ID for port $port"
      return 1
    fi
    
    # Try to gracefully kill processes
    for pid in $pids; do
      local process_name=$(ps -p $pid -o comm= 2>/dev/null)
      local process_path=$(ps -p $pid -o command= 2>/dev/null)
      
      # Skip Docker backend processes - we can't kill them safely
      if is_docker_process "$pid"; then
        print_warning "  Skipping Docker process: PID $pid ($process_name)"
        print_info "  Use 'docker stop <container>' to free this port"
        continue
      fi
      
      # Special handling for PostgreSQL and Redis
      # Free ports regardless of where they're running (local or Docker)
      if [[ "$port" == "5432" ]] && [[ "$process_path" == *"postgres"* ]] && [[ "$process_path" != *"docker"* ]]; then
        print_warning "  Found local PostgreSQL process: PID $pid"
        print_info "  Stopping local PostgreSQL to free port (will use Docker container)"
        
        if kill -TERM $pid 2>/dev/null; then
          print_info "  Sent SIGTERM to PostgreSQL process"
          sleep 3
          if kill -0 $pid 2>/dev/null; then
            print_warning "  PostgreSQL still running, sending SIGKILL..."
            kill -KILL $pid 2>/dev/null
            sleep 2
          fi
        else
          kill -KILL $pid 2>/dev/null
          sleep 2
        fi
        continue
      fi
      
      if [[ "$port" == "6379" ]] && [[ "$process_path" == *"redis"* ]] && [[ "$process_path" != *"docker"* ]]; then
        print_warning "  Found local Redis process: PID $pid"
        print_info "  Stopping local Redis to free port (will use Docker container)"
        
        if kill -TERM $pid 2>/dev/null; then
          print_info "  Sent SIGTERM to Redis process"
          sleep 2
          if kill -0 $pid 2>/dev/null; then
            print_warning "  Redis still running, sending SIGKILL..."
            kill -KILL $pid 2>/dev/null
            sleep 1
          fi
        else
          kill -KILL $pid 2>/dev/null
          sleep 1
        fi
        continue
      fi
      
      print_info "  Found process: PID $pid ($process_name)"
      
      # Try SIGTERM first (graceful shutdown)
      if kill -TERM $pid 2>/dev/null; then
        print_info "  Sent SIGTERM to PID $pid"
        sleep 2
        
        # Check if still running
        if kill -0 $pid 2>/dev/null; then
          print_warning "  Process still running, sending SIGKILL..."
          kill -KILL $pid 2>/dev/null
          sleep 1
        fi
      else
        # If TERM fails, try KILL
        print_warning "  SIGTERM failed, trying SIGKILL..."
        kill -KILL $pid 2>/dev/null
        sleep 1
      fi
    done
    
    # Verify port is now free
    sleep 1
    if is_port_in_use "$port"; then
      print_error "  Failed to free port $port"
      print_info "  You may need to manually stop the process or Docker container"
      return 1
    else
      print_success "  Port $port ($service_name) is now free"
      return 0
    fi
  else
    print_success "Port $port ($service_name) is available"
    return 0
  fi
}

# Function to free all ports
free_all_ports() {
  print_info "Checking and freeing occupied ports..."
  echo ""
  
  local freed_count=0
  local already_free_count=0
  
  for port_entry in "${PORTS[@]}"; do
    IFS=':' read -r port service_name <<< "$port_entry"
    
    if is_port_in_use "$port"; then
      if free_port "$port" "$service_name"; then
        freed_count=$((freed_count + 1))
      fi
    else
      already_free_count=$((already_free_count + 1))
    fi
  done
  
  echo ""
  print_success "Port check complete: $freed_count freed, $already_free_count already available"
  echo ""
}

# Function to start Docker Desktop (macOS)
start_docker_desktop() {
  print_info "Attempting to start Docker Desktop..."
  
  # Check if we're on macOS
  if [[ "$(uname)" != "Darwin" ]]; then
    print_warning "Auto-start Docker is only supported on macOS"
    return 1
  fi
  
  # Try to start Docker Desktop
  if open -a Docker > /dev/null 2>&1; then
    print_success "Docker Desktop launch command sent"
    return 0
  else
    print_error "Failed to start Docker Desktop"
    print_info "Please start Docker Desktop manually"
    return 1
  fi
}

# Function to check Docker
check_docker() {
  print_info "Checking Docker..."
  
  if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    print_info "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    return 1
  fi
  
  if ! docker info > /dev/null 2>&1; then
    print_warning "Docker is not running"
    
    # Try to start Docker Desktop automatically
    if start_docker_desktop; then
      print_loading "Waiting for Docker Desktop to start..."
      
      # Wait for Docker to start (max 60 seconds)
      local max_attempts=30
      local attempt=1
      
      while [ $attempt -le $max_attempts ]; do
        if docker info > /dev/null 2>&1; then
          print_success "Docker Desktop is now running"
          return 0
        fi
        
        if [ $attempt -lt $max_attempts ]; then
          printf "\r${CYAN}⟳${NC} Waiting for Docker... (attempt $attempt/$max_attempts)   "
          sleep 2
        fi
        attempt=$((attempt + 1))
      done
      
      printf "\n"
      print_error "Docker Desktop failed to start within 60 seconds"
      print_info "Please start Docker Desktop manually and try again"
      return 1
    else
      print_error "Could not auto-start Docker Desktop"
      print_info "Please start Docker Desktop manually and try again"
      return 1
    fi
  fi
  
  print_success "Docker is running"
  return 0
}

# Function to stop existing Docker containers
stop_existing_containers() {
  print_info "Checking for running Collector containers..."
  
  local containers=$(docker ps -a --filter "label=app=collector" --format "{{.Names}}" 2>/dev/null)
  
  if [ -n "$containers" ]; then
    print_warning "Found existing Collector containers, stopping them..."
    docker stop $(echo "$containers") > /dev/null 2>&1
    print_success "Existing containers stopped"
  else
    print_success "No existing containers found"
  fi
  echo ""
}

# Function to start infrastructure
start_infrastructure() {
  print_info "Starting infrastructure services..."
  
  if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found in current directory"
    return 1
  fi
  
  # Start infrastructure services
  if docker-compose up -d postgres redis rabbitmq db-init > /dev/null 2>&1; then
    print_success "Infrastructure services started"
    
    # Wait for infrastructure to be ready
    print_loading "Waiting for infrastructure to be ready..."
    sleep 10
    
    # Check infrastructure health
    print_info "Checking infrastructure health..."
    
    # Check PostgreSQL
    if docker exec collector-postgres pg_isready -U collector > /dev/null 2>&1; then
      print_success "PostgreSQL is ready"
    else
      print_warning "PostgreSQL is not ready yet (will continue)"
    fi
    
    # Check Redis
    if docker exec collector-redis redis-cli -a collector_redis_pass ping > /dev/null 2>&1; then
      print_success "Redis is ready"
    else
      print_warning "Redis is not ready yet (will continue)"
    fi
    
    # Check RabbitMQ
    if docker exec collector-rabbitmq rabbitmq-diagnostics ping > /dev/null 2>&1; then
      print_success "RabbitMQ is ready"
    else
      print_warning "RabbitMQ is not ready yet (will continue)"
    fi
    
    echo ""
    return 0
  else
    print_error "Failed to start infrastructure services"
    return 1
  fi
}

# Function to start microservices
start_microservices() {
  print_info "Starting microservices..."
  echo ""
  
  # Check if docker-compose.yml exists
  if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found in current directory"
    return 1
  fi
  
  # Start all microservices one by one for better error reporting
  # Order matters - start registry service first as others depend on it
  local services=(
    "collector-account-registry"
    "collector-orders"
    "collector-invoices"
    "collector-offers"
    "collector-inventory"
    "collector-delivery"
    "collector-hr"
    "collector-projects"
  )
  
  local failed_services=()
  
  for service in "${services[@]}"; do
    print_info "Starting $service..."
    
    # Try to start service and capture both stdout and stderr
    local output=$(docker-compose up -d "$service" 2>&1)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
      # Verify container actually started
      sleep 1
      if docker ps --format "{{.Names}}" | grep -q "^${service}$"; then
        print_success "$service started and running"
      else
        print_warning "$service started but container not found (may have exited)"
        failed_services+=("$service")
      fi
    else
      print_error "Failed to start $service"
      if [ -n "$output" ]; then
        print_info "Error details:"
        echo "$output" | while IFS= read -r line; do
          echo -e "  ${YELLOW}→${NC} $line"
        done
      fi
      failed_services+=("$service")
    fi
    
    # Small delay between service starts
    sleep 1
  done
  
  echo ""
  
  if [ ${#failed_services[@]} -gt 0 ]; then
    print_error "Failed to start ${#failed_services[@]} service(s):"
    for service in "${failed_services[@]}"; do
      echo -e "  ${RED}•${NC} $service"
    done
    
    print_info "Checking service logs..."
    for service in "${failed_services[@]}"; do
      echo ""
      print_info "Logs for $service:"
      docker-compose logs --tail=20 "$service" 2>&1 | head -30
    done
    
    echo ""
    print_warning "Some services failed to start. Continuing anyway..."
  else
    print_success "All microservices started"
  fi
  
  echo ""
  
  # Wait for services to start
  print_loading "Waiting for microservices to initialize..."
  sleep 15
  
  return 0
}

# Function to seed database
seed_database() {
  print_info "Seeding database with initial data..."
  echo ""
  
  # Wait a bit more to ensure registry service is fully ready
  print_loading "Waiting for Registry Service to be ready..."
  sleep 5
  
  # Try to run seed via Docker container
  if docker ps --format "{{.Names}}" | grep -q "^collector-account-registry$"; then
    print_info "Running database seed via Docker container..."
    if docker exec collector-account-registry npm run db:seed > /dev/null 2>&1; then
      print_success "Database seeded successfully"
      return 0
    else
      print_warning "Seed failed via Docker, trying alternative method..."
      
      # Try direct execution if tsx is available in container
      if docker exec collector-account-registry npx tsx src/prisma/seed.ts > /dev/null 2>&1; then
        print_success "Database seeded successfully (alternative method)"
        return 0
      else
        print_warning "Could not seed database automatically"
        print_info "You can seed manually with: docker exec collector-account-registry npm run db:seed"
        return 1
      fi
    fi
  else
    print_warning "Registry Service container not found, skipping seed"
    print_info "You can seed manually with: docker exec collector-account-registry npm run db:seed"
    return 1
  fi
}

# Function to check service health
check_service_health() {
  local service_url=$1
  local service_name=$2
  local max_attempts=20
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    if curl -f -s "${service_url}/health" > /dev/null 2>&1; then
      print_success "$service_name is healthy"
      return 0
    fi
    
    if [ $attempt -lt $max_attempts ]; then
      printf "\r${CYAN}⟳${NC} Waiting for $service_name... (attempt $attempt/$max_attempts)   "
      sleep 2
    fi
    attempt=$((attempt + 1))
  done
  
  printf "\n"
  print_warning "$service_name is not responding (may still be starting)"
  return 1
}

# Function to verify services
verify_services() {
  print_info "Verifying service health..."
  echo ""
  
  local services=(
    "http://localhost:3001:Registry Service"
    "http://localhost:3002:Orders Service"
    "http://localhost:3003:Invoices Service"
    "http://localhost:3004:Offers Service"
    "http://localhost:3005:Inventory Service"
    "http://localhost:3006:HR Service"
    "http://localhost:3007:Project Management Service"
    "http://localhost:3008:Delivery Service"
  )
  
  local healthy_count=0
  
  for service_entry in "${services[@]}"; do
    IFS=':' read -r protocol _ port service_name <<< "$service_entry"
    service_url="${protocol}://localhost:${port}"
    
    if check_service_health "$service_url" "$service_name"; then
      healthy_count=$((healthy_count + 1))
    fi
    echo ""
  done
  
  echo ""
  if [ $healthy_count -eq ${#services[@]} ]; then
    print_success "All services are healthy!"
  else
    print_warning "Some services are still starting up (this is normal)"
  fi
}

# Function to start Next.js application
start_nextjs() {
  print_info "Starting Next.js application..."
  echo ""
  
  # Check if node_modules exists
  if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found, installing dependencies..."
    if npm install > /dev/null 2>&1; then
      print_success "Dependencies installed"
    else
      print_error "Failed to install dependencies"
      return 1
    fi
  fi
  
  # Start Next.js in background
  print_info "Starting Next.js dev server on port 3000..."
  
  # Kill any existing Next.js process on port 3000
  if is_port_in_use 3000; then
    free_port 3000 "Next.js Application"
  fi
  
  # Start Next.js
  npm run dev > /tmp/nextjs.log 2>&1 &
  local nextjs_pid=$!
  
  # Wait a bit for Next.js to start
  sleep 5
  
  # Check if Next.js started successfully
  if kill -0 $nextjs_pid 2>/dev/null && is_port_in_use 3000; then
    print_success "Next.js application started (PID: $nextjs_pid)"
    echo "$nextjs_pid" > /tmp/collector-nextjs.pid
    return 0
  else
    print_error "Failed to start Next.js application"
    print_info "Check logs: tail -f /tmp/nextjs.log"
    return 1
  fi
}

# Handle script interruption - but don't kill Next.js on exit
cleanup() {
  echo ""
  print_warning "Script interrupted, cleaning up..."
  # Note: We intentionally don't kill Next.js here - it should keep running
  # User can stop it manually with: kill $(cat /tmp/collector-nextjs.pid)
}

# Only trap interrupt signals, not EXIT - we want Next.js to keep running
trap cleanup INT TERM

# Function to find project root directory
find_project_root() {
  local current_dir="$PWD"
  local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  
  # Start from script directory and go up to find docker-compose.yml
  local dir="$script_dir"
  while [ "$dir" != "/" ]; do
    if [ -f "$dir/docker-compose.yml" ]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  
  # Fallback: try current directory
  if [ -f "$current_dir/docker-compose.yml" ]; then
    echo "$current_dir"
    return 0
  fi
  
  # If still not found, return script's parent directory (assuming scripts/ is in project root)
  echo "$(dirname "$script_dir")"
  return 1
}

# Main execution
main() {
  # Change to project root directory where docker-compose.yml is located
  local project_root=$(find_project_root)
  cd "$project_root" || {
    print_error "Failed to change to project root directory: $project_root"
    exit 1
  }
  
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}   Collector Platform - Development Startup${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo ""
  print_info "Working directory: $PWD"
  echo ""
  
  # Step 1: Free all occupied ports
  free_all_ports
  
  # Step 2: Check Docker
  if ! check_docker; then
    exit 1
  fi
  echo ""
  
  # Step 3: Stop existing containers
  stop_existing_containers
  
  # Step 4: Start infrastructure
  if ! start_infrastructure; then
    print_error "Failed to start infrastructure"
    exit 1
  fi
  
  # Step 5: Start microservices
  start_microservices
  
  # Step 6: Seed database (if Registry Service is ready)
  seed_database
  echo ""
  
  # Step 7: Verify services
  verify_services
  
  # Step 8: Start Next.js
  if ! start_nextjs; then
    print_warning "Next.js failed to start, but services are running"
  fi
  
  # Final summary
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}   ✓ Collector Platform is starting!${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo ""
  print_success "Access Points:"
  echo -e "  ${GREEN}•${NC} Next.js Dashboard: ${CYAN}http://localhost:3000${NC}"
  echo -e "  ${GREEN}•${NC} Registry Service: ${CYAN}http://localhost:3001${NC}"
  echo -e "  ${GREEN}•${NC} Orders Service: ${CYAN}http://localhost:3002${NC}"
  echo -e "  ${GREEN}•${NC} Invoices Service: ${CYAN}http://localhost:3003${NC}"
  echo -e "  ${GREEN}•${NC} Offers Service: ${CYAN}http://localhost:3004${NC}"
  echo -e "  ${GREEN}•${NC} Inventory Service: ${CYAN}http://localhost:3005${NC}"
  echo -e "  ${GREEN}•${NC} HR Service: ${CYAN}http://localhost:3006${NC}"
  echo -e "  ${GREEN}•${NC} Project Management: ${CYAN}http://localhost:3007${NC}"
  echo -e "  ${GREEN}•${NC} Delivery Service: ${CYAN}http://localhost:3008${NC}"
  echo ""
  print_info "Useful commands:"
  echo "  • View logs: docker-compose logs -f [service-name]"
  echo "  • Stop all: docker-compose down"
  echo "  • Stop Next.js: kill \$(cat /tmp/collector-nextjs.pid)"
  echo "  • View Next.js logs: tail -f /tmp/nextjs.log"
  echo ""
  
  return 0
}

# Run main function
main "$@"

