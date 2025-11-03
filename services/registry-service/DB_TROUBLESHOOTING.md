# Database Troubleshooting Guide

## Common Error: `database "registry_user" does not exist`

### Problem
PostgreSQL is trying to connect to a database named after the username instead of `registry_db`.

### Root Causes

1. **Incorrect DATABASE_URL format**
   - PostgreSQL uses the database name from the connection string
   - If the URL is malformed, it might default to using the username as database name

2. **Database not created**
   - The `registry_db` database hasn't been created in PostgreSQL
   - Docker container might have started but database initialization failed

3. **Wrong connection parameters**
   - Connection string points to wrong database
   - User doesn't have access to the database

### Solutions

#### Solution 1: Verify DATABASE_URL Format

Check your `DATABASE_URL` environment variable:

```bash
# Correct format:
postgresql://registry_user:registry_pass@postgres:5432/registry_db?schema=public

# Components:
# - Protocol: postgresql://
# - Username: registry_user
# - Password: registry_pass
# - Host: postgres (or localhost)
# - Port: 5432
# - Database: registry_db (IMPORTANT: must be the database name, not username!)
# - Schema: public
```

#### Solution 2: Create Database Manually

If using Docker Compose:

```bash
# Connect to PostgreSQL container
docker exec -it registry-postgres psql -U postgres

# Create database and user
CREATE DATABASE registry_db;
CREATE USER registry_user WITH PASSWORD 'registry_pass';
GRANT ALL PRIVILEGES ON DATABASE registry_db TO registry_user;
\c registry_db
GRANT ALL ON SCHEMA public TO registry_user;
ALTER SCHEMA public OWNER TO registry_user;
\q
```

#### Solution 3: Reset Docker Volumes

If database was created incorrectly:

```bash
# Stop services
docker-compose down

# Remove volumes (WARNING: This deletes all data!)
docker volume rm registry-service_postgres_data

# Start fresh
docker-compose up -d
```

#### Solution 4: Use Setup Script

Run the database setup script:

```bash
# Inside Docker container
docker exec -it registry-postgres bash -c "
  export PGHOST=localhost
  export PGPORT=5432
  export PGUSER=postgres
  psql -c \"CREATE DATABASE registry_db;\" || true
  psql -c \"CREATE USER registry_user WITH PASSWORD 'registry_pass';\" || true
  psql -c \"GRANT ALL PRIVILEGES ON DATABASE registry_db TO registry_user;\"
  psql -d registry_db -c \"GRANT ALL ON SCHEMA public TO registry_user;\"
  psql -d registry_db -c \"ALTER SCHEMA public OWNER TO registry_user;\"
"
```

#### Solution 5: Fix docker-compose.yml

Ensure the `postgres` service creates the database:

```yaml
postgres:
  image: postgres:16-alpine
  environment:
    POSTGRES_USER: registry_user
    POSTGRES_PASSWORD: registry_pass
    POSTGRES_DB: registry_db  # This creates the database automatically
```

### Verification Steps

1. **Check if database exists:**
```bash
docker exec -it registry-postgres psql -U postgres -c "\l" | grep registry_db
```

2. **Test connection:**
```bash
docker exec -it registry-postgres psql -U registry_user -d registry_db -c "SELECT current_database();"
```

3. **Check DATABASE_URL in container:**
```bash
docker exec -it registry-service env | grep DATABASE_URL
```

4. **Verify Prisma can connect:**
```bash
docker exec -it registry-service npm run db:generate
docker exec -it registry-service npx prisma db pull
```

### Quick Fix Script

Save this as `fix-db.sh` and run it:

```bash
#!/bin/bash
set -e

echo "🔧 Fixing Registry Service database..."

# Connect to postgres and create everything
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
\c registry_db
GRANT ALL ON SCHEMA public TO registry_user;
ALTER SCHEMA public OWNER TO registry_user;
EOF

echo "✅ Database setup complete!"
echo ""
echo "Restarting registry-service..."
docker-compose restart registry-service

echo "✅ Done! Check logs:"
echo "docker-compose logs -f registry-service"
```

### Prevention

To prevent this issue in the future:

1. **Always specify POSTGRES_DB in docker-compose.yml**
2. **Use health checks** to ensure database is ready
3. **Wait for database** in startup command before running migrations
4. **Verify DATABASE_URL format** matches: `postgresql://user:pass@host:port/dbname?schema=public`

### Still Having Issues?

If none of the above solutions work:

1. Check PostgreSQL logs:
```bash
docker-compose logs postgres
```

2. Check Registry Service logs:
```bash
docker-compose logs registry-service
```

3. Verify network connectivity:
```bash
docker exec -it registry-service ping postgres
```

4. Test DATABASE_URL manually:
```bash
docker exec -it registry-service sh -c "echo \$DATABASE_URL"
```

