#!/bin/bash

# Setup script for Registry Service database
# This script ensures the database and user are created correctly

set -e

DB_NAME=${POSTGRES_DB:-registry_db}
DB_USER=${POSTGRES_USER:-registry_user}
DB_PASSWORD=${POSTGRES_PASSWORD:-registry_pass}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "🔧 Setting up Registry Service database..."
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST:$DB_PORT"

# Check if running in Docker
if [ -f /.dockerenv ]; then
    echo "🐳 Running inside Docker container"
    # Use postgres superuser for setup
    PGHOST=$DB_HOST
    PGPORT=$DB_PORT
    PGUSER=postgres
    export PGHOST PGPORT PGUSER
else
    echo "💻 Running on host machine"
    # Assume we have access to postgres user or provide credentials
    PGHOST=$DB_HOST
    PGPORT=$DB_PORT
    PGUSER=${PGUSER:-postgres}
    export PGHOST PGPORT PGUSER
fi

# Function to execute SQL
execute_sql() {
    if [ -f /.dockerenv ]; then
        # Inside Docker - use psql directly
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$PGUSER" -c "$1"
    else
        # On host - try with psql
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$PGUSER" -c "$1" || {
            echo "⚠️  Could not connect to PostgreSQL. Make sure:"
            echo "   1. PostgreSQL is running"
            echo "   2. You have access as postgres user"
            echo "   3. Connection parameters are correct"
            exit 1
        }
    fi
}

# Create database if it doesn't exist
echo "📦 Creating database if it doesn't exist..."
execute_sql "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    execute_sql "CREATE DATABASE $DB_NAME;" || \
    echo "⚠️  Database might already exist or creation failed"

# Create user if it doesn't exist
echo "👤 Creating user if it doesn't exist..."
execute_sql "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1 || \
    execute_sql "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || \
    echo "⚠️  User might already exist or creation failed"

# Grant privileges
echo "🔐 Granting privileges..."
execute_sql "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
execute_sql "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"

# Connect to the database and grant schema privileges
echo "🔑 Granting schema privileges..."
execute_sql "\\c $DB_NAME" > /dev/null 2>&1 || true
execute_sql "GRANT ALL ON SCHEMA public TO $DB_USER;"
execute_sql "ALTER SCHEMA public OWNER TO $DB_USER;"

echo "✅ Database setup complete!"
echo ""
echo "Connection string:"
echo "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"

