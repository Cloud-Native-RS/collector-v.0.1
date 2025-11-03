#!/bin/bash

# Setup script - Creates all required databases for Collector Platform
set -e

echo "🔧 Setting up Collector Platform databases..."
echo ""

POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-collector}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-collector_dev_pass}

export PGPASSWORD="$POSTGRES_PASSWORD"

# List of databases to create
DATABASES=(
  "collector_registry_db"
  "collector_orders_db"
  "collector_invoices_db"
  "collector_offers_db"
  "collector_inventory_db"
  "collector_delivery_db"
  "collector_hr_db"
  "collector_projects_db"
  "collector_crm_db"
)

echo "📦 Creating databases..."

for db in "${DATABASES[@]}"; do
  echo -n "  Creating $db... "
  
  # Check if database exists
  if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -lqt | cut -d \| -f 1 | grep -qw "$db"; then
    echo "✅ Already exists"
  else
    # Create database
    if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $db;" > /dev/null 2>&1; then
      echo "✅ Created"
    else
      echo "❌ Failed"
    fi
  fi
  
  # Grant privileges
  psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$db" -c "GRANT ALL ON SCHEMA public TO $POSTGRES_USER;" > /dev/null 2>&1 || true
  psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$db" -c "ALTER SCHEMA public OWNER TO $POSTGRES_USER;" > /dev/null 2>&1 || true
done

echo ""
echo "✅ All databases created successfully!"
echo ""
echo "📊 Database list:"
psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -l | grep collector || echo "  No collector databases found"

unset PGPASSWORD
