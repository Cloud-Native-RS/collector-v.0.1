#!/bin/bash

# Free All Occupied Ports
# Utility script to free all ports used by Collector Platform

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

# Helper functions
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
  local force=$3
  
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
      local process_info=$(ps -p $pid -o pid,comm,args= 2>/dev/null | tail -1)
      
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
        print_info "  Stopping local PostgreSQL to free port"
        
        if [ "$force" = "true" ]; then
          kill -KILL $pid 2>/dev/null
          print_success "  Killed PostgreSQL PID $pid (force)"
        else
          if kill -TERM $pid 2>/dev/null; then
            print_info "  Sent SIGTERM to PostgreSQL process"
            sleep 3
            if kill -0 $pid 2>/dev/null; then
              print_warning "  PostgreSQL still running, sending SIGKILL..."
              kill -KILL $pid 2>/dev/null
              sleep 1
            fi
          else
            kill -KILL $pid 2>/dev/null
            sleep 1
          fi
        fi
        continue
      fi
      
      if [[ "$port" == "6379" ]] && [[ "$process_path" == *"redis"* ]] && [[ "$process_path" != *"docker"* ]]; then
        print_warning "  Found local Redis process: PID $pid"
        print_info "  Stopping local Redis to free port"
        
        if [ "$force" = "true" ]; then
          kill -KILL $pid 2>/dev/null
          print_success "  Killed Redis PID $pid (force)"
        else
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
        fi
        continue
      fi
      
      print_info "  Found process: $process_info"
      
      if [ "$force" = "true" ]; then
        # Force kill
        if kill -KILL $pid 2>/dev/null; then
          print_success "  Killed PID $pid (force)"
        else
          print_error "  Failed to kill PID $pid"
        fi
      else
        # Try graceful shutdown first
        if kill -TERM $pid 2>/dev/null; then
          print_info "  Sent SIGTERM to PID $pid (graceful shutdown)"
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

# Function to stop Docker containers
stop_docker_containers() {
  print_info "Stopping Collector Docker containers..."
  
  local containers=$(docker ps -a --filter "label=app=collector" --format "{{.Names}}" 2>/dev/null)
  
  if [ -n "$containers" ]; then
    print_warning "Found Collector containers, stopping them..."
    
    # Stop containers
    docker stop $(echo "$containers") > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
      print_success "Docker containers stopped"
    else
      print_warning "Some containers may not have stopped properly"
    fi
  else
    print_info "No Collector containers found"
  fi
}

# Main execution
main() {
  local force_kill=false
  
  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      -f|--force)
        force_kill=true
        shift
        ;;
      -h|--help)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Free all ports used by Collector Platform"
        echo ""
        echo "Options:"
        echo "  -f, --force    Force kill processes (no graceful shutdown)"
        echo "  -h, --help     Show this help message"
        echo ""
        exit 0
        ;;
      *)
        print_error "Unknown option: $1"
        echo "Use -h or --help for usage information"
        exit 1
        ;;
    esac
  done
  
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}   Free Collector Platform Ports${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo ""
  
  # Stop Docker containers first
  if command -v docker &> /dev/null && docker info > /dev/null 2>&1; then
    stop_docker_containers
    echo ""
  else
    print_info "Docker not available, skipping container cleanup"
    echo ""
  fi
  
  # Free all ports
  print_info "Checking and freeing occupied ports..."
  echo ""
  
  local freed_count=0
  local already_free_count=0
  local failed_count=0
  
  for port_entry in "${PORTS[@]}"; do
    IFS=':' read -r port service_name <<< "$port_entry"
    
    if is_port_in_use "$port"; then
      if free_port "$port" "$service_name" "$force_kill"; then
        freed_count=$((freed_count + 1))
      else
        failed_count=$((failed_count + 1))
      fi
    else
      already_free_count=$((already_free_count + 1))
    fi
    echo ""
  done
  
  # Summary
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  print_info "Summary:"
  echo -e "  ${GREEN}✓${NC} Freed: $freed_count"
  echo -e "  ${GREEN}✓${NC} Already free: $already_free_count"
  if [ $failed_count -gt 0 ]; then
    echo -e "  ${RED}✗${NC} Failed: $failed_count"
  fi
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo ""
  
  if [ $failed_count -gt 0 ]; then
    print_warning "Some ports could not be freed. Try using --force option."
    exit 1
  else
    print_success "All ports are now free!"
    exit 0
  fi
}

# Run main function
main "$@"

