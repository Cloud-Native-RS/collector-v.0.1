#!/bin/bash

# Verify database connection and URL format
set -e

DATABASE_URL=${DATABASE_URL:-"postgresql://registry_user:registry_pass@localhost:5432/registry_db?schema=public"}

echo "🔍 Verifying DATABASE_URL..."
echo "DATABASE_URL: ${DATABASE_URL//:[^:@]*@/:****@}"

# Extract components from DATABASE_URL
# Format: postgresql://user:password@host:port/database?schema=public
if [[ ! $DATABASE_URL =~ ^postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/([^?]+) ]]; then
    echo "❌ Invalid DATABASE_URL format!"
    echo "Expected format: postgresql://user:password@host:port/database?schema=public"
    exit 1
fi

USERNAME="${BASH_REMATCH[1]}"
PASSWORD="${BASH_REMATCH[2]}"
HOST="${BASH_REMATCH[3]}"
PORT="${BASH_REMATCH[4]}"
DATABASE="${BASH_REMATCH[5]}"

echo ""
echo "Parsed components:"
echo "  Username: $USERNAME"
echo "  Password: ****"
echo "  Host: $HOST"
echo "  Port: $PORT"
echo "  Database: $DATABASE"
echo ""

# Check if database name matches username (common mistake)
if [ "$DATABASE" = "$USERNAME" ]; then
    echo "⚠️  WARNING: Database name matches username!"
    echo "   This might cause connection issues."
    echo "   Database should be 'registry_db', username should be 'registry_user'"
    echo ""
fi

# Test connection
echo "🔌 Testing connection..."
export PGPASSWORD="$PASSWORD"
if psql -h "$HOST" -p "$PORT" -U "$USERNAME" -d "$DATABASE" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Connection successful!"
    
    # Check if database exists
    if psql -h "$HOST" -p "$PORT" -U "$USERNAME" -d "$DATABASE" -c "SELECT current_database();" > /dev/null 2>&1; then
        echo "✅ Database '$DATABASE' is accessible"
    else
        echo "❌ Cannot access database '$DATABASE'"
        exit 1
    fi
else
    echo "❌ Connection failed!"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check if PostgreSQL is running: docker ps | grep postgres"
    echo "2. Verify DATABASE_URL is correct"
    echo "3. Check if database exists: docker exec -it registry-postgres psql -U postgres -c '\\l'"
    echo "4. Check user permissions"
    exit 1
fi

