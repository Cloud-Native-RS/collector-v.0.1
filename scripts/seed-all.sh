#!/usr/bin/env bash

# Master script za pokretanje svih seed skripti kroz Docker kontejnere
# Usage: ./scripts/seed-all.sh

set -e

echo "🌱 Seeding all microservices databases through Docker containers..."
echo ""

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BASE_DIR" || exit 1

# Proveri da li se koristi bash (potrebno za asocijativne nizove)
if [ -z "$BASH_VERSION" ]; then
  echo "❌ This script requires bash. Please run with: bash $0"
  exit 1
fi

# Mapiranje service dir-a na Docker Compose service name (iz docker-compose.yml)
declare -A service_map
service_map["registry-service"]="collector-account-registry"
service_map["inventory-service"]="collector-inventory"
service_map["offers-service"]="collector-offers"
service_map["orders-service"]="collector-orders"
service_map["invoices-service"]="collector-invoices"
service_map["delivery-service"]="collector-delivery"
service_map["hr-service"]="collector-hr"
service_map["project-management-service"]="collector-projects"

# Mapiranje service dir-a na container name (za proveru)
declare -A container_map
container_map["registry-service"]="collector-account-registry"
container_map["inventory-service"]="collector-inventory"
container_map["offers-service"]="collector-offers"
container_map["orders-service"]="collector-orders"
container_map["invoices-service"]="collector-invoices"
container_map["delivery-service"]="collector-delivery"
container_map["hr-service"]="collector-hr"
container_map["project-management-service"]="collector-projects"

services=(
  "registry-service"
  "inventory-service"
  "offers-service"
  "orders-service"
  "invoices-service"
  "delivery-service"
  "hr-service"
  "project-management-service"
)

failed_services=()

# Proveri da li Docker i docker-compose rade
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is not installed or not in PATH"
  exit 1
fi

if ! docker ps &> /dev/null; then
  echo "❌ Docker daemon is not running. Please start Docker."
  exit 1
fi

for service in "${services[@]}"; do
  service_name="${service_map[$service]}"
  container_name="${container_map[$service]}"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📦 Seeding $service (service: $service_name, container: $container_name)..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Proveri da li kontejner postoji i radi
  if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
    echo "⚠️  Container $container_name is not running. Trying to start it..."
    docker-compose up -d "$service_name" || {
      echo "❌ Failed to start service $service_name"
      failed_services+=("$service")
      continue
    }
    
    # Čekaj da se kontejner pokrene
    echo "⏳ Waiting for container to be ready..."
    sleep 5
  fi
  
  # Pokreni seed kroz Docker kontejner
  # Problem: tsx nije dostupan u production image-u (devDependency)
  # Zato pokrećemo seed lokalno sa pravilnim DATABASE_URL
  
  echo "⚠️  Note: Seed scripts need tsx (devDependency)."
  echo "   Running seed locally with DATABASE_URL from Docker..."
  
  # Konstruiši DATABASE_URL za lokalni pristup
  # Docker kontejneri koriste "postgres" kao hostname, ali lokalno trebamo "localhost"
  case "$service" in
    "registry-service") db_name="collector_account_registry_db" ;;
    "offers-service") db_name="collector_offers_db" ;;
    "orders-service") db_name="collector_orders_db" ;;
    "invoices-service") db_name="collector_invoices_db" ;;
    "delivery-service") db_name="collector_delivery_db" ;;
    "inventory-service") db_name="collector_inventory_db" ;;
    "hr-service") db_name="collector_hr_db" ;;
    "project-management-service") db_name="collector_projects_db" ;;
    *) db_name="" ;;
  esac
  
  if [ -n "$db_name" ]; then
    # Koristimo localhost jer pokrećemo seed lokalno
    db_url="postgresql://collector:collector_dev_pass@localhost:5432/${db_name}?schema=public"
    
    # Proveri da li baza postoji
    echo "   🔍 Checking database '$db_name'..."
    if ! docker exec -e PGPASSWORD=collector_dev_pass collector-postgres psql -U collector -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$db_name'" | grep -q 1; then
      echo "   ⚠️  Database '$db_name' does not exist!"
      echo "   💡 Suggestion: Run 'docker-compose up -d db-init' to create databases"
      failed_services+=("$service")
      echo ""
      continue
    fi
    
    # Test konekcije
    if ! docker exec -e PGPASSWORD=collector_dev_pass collector-postgres psql -U collector -d "$db_name" -c "SELECT 1" > /dev/null 2>&1; then
      echo "   ⚠️  Cannot connect to database '$db_name'!"
      echo "   💡 Suggestion: Check database credentials and permissions"
      failed_services+=("$service")
      echo ""
      continue
    fi
    
    # Osiguraj dozvole pre seed-a
    echo "   🔐 Ensuring database permissions..."
    perm_result=$(docker exec -e PGPASSWORD=collector_dev_pass collector-postgres psql -U collector -d "$db_name" <<EOF 2>&1
-- Ensure collector owns schema
ALTER SCHEMA public OWNER TO collector;

-- Grant all privileges on schema
GRANT ALL ON SCHEMA public TO collector;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO collector;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO collector;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO collector;

-- Grant on existing tables and sequences (if any exist from migrations)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO collector;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO collector;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO collector;
EOF
)
    
    # Proveri da li ima tabela (migrations)
    table_count=$(docker exec -e PGPASSWORD=collector_dev_pass collector-postgres psql -U collector -d "$db_name" -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | xargs || echo "0")
    if [ "$table_count" = "0" ] || [ -z "$table_count" ]; then
      echo "   ⚠️  No tables found in database '$db_name' (migrations not run?)"
      echo "   💡 Suggestion: Run migrations first: docker-compose exec $container_name npm run db:migrate:deploy"
    else
      echo "   ✅ Found $table_count tables in database"
    fi
  fi
  
  if [ -n "$db_url" ] && [ -d "services/$service" ]; then
    cd "services/$service" || {
      echo "   ❌ Failed to change directory to services/$service"
      failed_services+=("$service")
      cd "$BASE_DIR"
      echo ""
      continue
    }
    
    if [ ! -f "package.json" ]; then
      echo "   ⚠️  package.json not found in services/$service"
      failed_services+=("$service")
      cd "$BASE_DIR"
      echo ""
      continue
    fi
    
    if ! grep -q '"db:seed"' package.json; then
      echo "   ⚠️  No 'db:seed' script found in package.json"
      failed_services+=("$service")
      cd "$BASE_DIR"
      echo ""
      continue
    fi
    
    echo "   📦 Running seed script..."
    echo "   Using DATABASE_URL: ${db_url%%@*}@***"
    
    # Pokreni seed script i snimi output
    # Koristimo process substitution za hvatanje outputa dok ga prikazujemo
    seed_output_file=$(mktemp 2>/dev/null || echo /tmp/seed_output_$$.log)
    
    echo "   ⏳ Seed script is running... (this may take a minute)"
    
    # Pokreni seed script - output ide u fajl i na stdout (sa tee)
    # Ako tee nije dostupan, koristimo samo redirect
    if command -v tee > /dev/null 2>&1; then
      if DATABASE_URL="$db_url" npm run db:seed 2>&1 | tee "$seed_output_file"; then
        seed_exit_code=0
      else
        seed_exit_code=${PIPESTATUS[0]}
      fi
    else
      # Fallback bez tee - samo redirect u fajl, bez real-time outputa
      if DATABASE_URL="$db_url" npm run db:seed > "$seed_output_file" 2>&1; then
        seed_exit_code=0
        # Prikaži output nakon izvršavanja
        echo ""
        echo "   📋 Seed script output:"
        cat "$seed_output_file" | head -20 | sed 's/^/      /'
        if [ $(wc -l < "$seed_output_file" 2>/dev/null || echo 0) -gt 20 ]; then
          echo "      ... (showing first 20 lines, see full output if needed)"
        fi
      else
        seed_exit_code=$?
      fi
    fi
    
    # Pročitaj kompletan output iz fajla za analizu
    seed_output=$(cat "$seed_output_file" 2>/dev/null || echo "")
    rm -f "$seed_output_file" 2>/dev/null || true
    echo ""
    
    if [ $seed_exit_code -eq 0 ]; then
      echo "   ✅ Successfully seeded $service"
      # Proveri da li ima korisnih poruka u outputu
      success_msg=$(echo "$seed_output" | grep -E "✅|Success|Created.*total|seeding completed" | tail -3)
      if [ -n "$success_msg" ]; then
        echo "$success_msg" | sed 's/^/      /'
      fi
    else
      echo "   ❌ Failed to seed $service (exit code: $seed_exit_code)"
      echo ""
      echo "   📋 Error details:"
      
      # Ekstrahuj Prisma grešku ili glavnu grešku
      error_line=$(echo "$seed_output" | grep -E "PrismaClientInitializationError|was denied access|ERROR|Error|Failed|failed" | head -5)
      if [ -n "$error_line" ]; then
        echo "$error_line" | sed 's/^/      ❌ /'
      else
        # Prikaži poslednje 15 linija ako nema specifičnih grešaka
        echo "$seed_output" | tail -15 | sed 's/^/      /'
      fi
      
      # Dodaj specifične sugestije na osnovu greške
      if echo "$seed_output" | grep -qi "was denied access"; then
        echo ""
        echo "   💡 Permission issue detected!"
        echo "      → Database: $db_name"
        echo "      → User: collector"
        echo "      → Solution: Check if migrations were run and permissions are set correctly"
        echo "      → Try: docker-compose exec $container_name npm run db:migrate:deploy"
      elif echo "$seed_output" | grep -qi "relation.*does not exist"; then
        echo ""
        echo "   💡 Missing tables detected!"
        echo "      → Database: $db_name"
        echo "      → Solution: Run migrations first:"
        echo "         docker-compose exec $container_name npm run db:migrate:deploy"
      elif echo "$seed_output" | grep -qi "Can't reach database server\|connection.*refused\|ECONNREFUSED"; then
        echo ""
        echo "   💡 Connection issue detected!"
        echo "      → Database: $db_name"
        echo "      → Solution: Check if Docker container 'collector-postgres' is running:"
        echo "         docker ps | grep collector-postgres"
      elif echo "$seed_output" | grep -qi "tsx.*not found\|command not found"; then
        echo ""
        echo "   💡 Missing dependency detected!"
        echo "      → tsx is not available"
        echo "      → Solution: Install dependencies in service directory:"
        echo "         cd services/$service && npm install"
      fi
      
      failed_services+=("$service")
    fi
    
    cd "$BASE_DIR" || exit 1
  else
    if [ -z "$db_name" ]; then
      echo "   ❌ Cannot determine database name for service '$service'"
    elif [ ! -d "services/$service" ]; then
      echo "   ❌ Service directory 'services/$service' not found"
    fi
    failed_services+=("$service")
  fi
  
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ ${#failed_services[@]} -eq 0 ]; then
  echo "✅ All seed scripts completed successfully!"
  echo ""
  echo "📊 Summary:"
  echo "   - All services seeded without errors"
  echo "   - You can now test the application"
else
  echo "⚠️  Some services failed to seed!"
  echo ""
  echo "📊 Summary:"
  echo "   ❌ Failed services (${#failed_services[@]}):"
  for service in "${failed_services[@]}"; do
    echo "      - $service"
  done
  echo ""
  echo "🔧 Common fixes:"
  echo "   1. Run database migrations:"
  echo "      docker-compose exec <service-name> npm run db:migrate:deploy"
  echo ""
  echo "   2. Check database exists:"
  echo "      docker exec collector-postgres psql -U collector -l | grep collector"
  echo ""
  echo "   3. Restart database init:"
  echo "      docker-compose up -d db-init"
  echo ""
  echo "   4. Check service logs:"
  echo "      docker-compose logs <service-name>"
  exit 1
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

