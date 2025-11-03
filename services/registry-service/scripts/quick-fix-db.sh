#!/bin/bash

# Quick fix for "database registry_user does not exist" error
# This script directly fixes the database connection issue

set -e

echo "🔧 Quick Fix: Creating registry_db database..."

# Check if running in Docker or locally
if docker ps | grep -q registry-postgres; then
    echo "🐳 Found Docker container: registry-postgres"
    
    # Method 1: Connect as postgres superuser and create database
    echo "📦 Creating database and user..."
    docker exec -i registry-postgres psql -U postgres <<EOF
-- Create database if not exists
SELECT 'CREATE DATABASE registry_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'registry_db')\gexec

-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'registry_user') THEN
    CREATE USER registry_user WITH PASSWORD 'registry_pass';
  END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE registry_db TO registry_user;
EOF

    # Connect to registry_db and set up schema
    echo "🔑 Setting up schema permissions..."
    docker exec -i registry-postgres psql -U postgres -d registry_db <<EOF
GRANT ALL ON SCHEMA public TO registry_user;
ALTER SCHEMA public OWNER TO registry_user;
EOF

    echo ""
    echo "✅ Database created successfully!"
    echo ""
    echo "Testing connection..."
    if docker exec -i registry-postgres psql -U registry_user -d registry_db -c "SELECT current_database();" > /dev/null 2>&1; then
        echo "✅ Connection test successful!"
        echo ""
        echo "You can now restart the registry-service:"
        echo "  docker-compose restart registry-service"
        echo ""
        echo "Or restart everything:"
        echo "  docker-compose down && docker-compose up -d"
    else
        echo "❌ Connection test failed. Please check the error above."
        exit 1
    fi
else
    echo "❌ Docker container 'registry-postgres' not found!"
    echo ""
    echo "Please start the services first:"
    echo "  cd services/registry-service"
    echo "  docker-compose up -d postgres"
    exit 1
fi

