#!/bin/bash

# Health check script for all infrastructure components

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_service() {
  local name=$1
  local url=$2
  local expected=$3

  if curl -f -s "$url" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} $name: OK"
    return 0
  else
    echo -e "${RED}✗${NC} $name: FAILED ($url)"
    return 1
  fi
}

echo -e "${BLUE}Infrastructure Health Check${NC}"
echo "================================"
echo ""

failed=0

# Kong
check_service "Kong Gateway" "http://localhost:8000/health" || failed=$((failed + 1))
check_service "Kong Admin" "http://localhost:8001/health" || failed=$((failed + 1))

# HAProxy
check_service "HAProxy" "http://localhost:9999" || failed=$((failed + 1))

# NATS
check_service "NATS" "http://localhost:8222/healthz" || failed=$((failed + 1))

# Redis
if docker exec collector-redis redis-cli ping > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Redis: OK"
else
  echo -e "${RED}✗${NC} Redis: FAILED"
  failed=$((failed + 1))
fi

# PostgreSQL
if docker exec collector-postgres pg_isready -U collector_user > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} PostgreSQL: OK"
else
  echo -e "${RED}✗${NC} PostgreSQL: FAILED"
  failed=$((failed + 1))
fi

echo ""
if [ $failed -eq 0 ]; then
  echo -e "${GREEN}All services are healthy!${NC}"
  exit 0
else
  echo -e "${RED}$failed service(s) failed${NC}"
  exit 1
fi

