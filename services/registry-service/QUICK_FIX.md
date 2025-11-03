# Quick Fix: Database "registry_user" does not exist

## Immediate Solution

Run this command to fix the database issue:

```bash
cd services/registry-service
./scripts/quick-fix-db.sh
```

Or manually:

```bash
docker exec -i registry-postgres psql -U postgres <<EOF
CREATE DATABASE registry_db;
CREATE USER registry_user WITH PASSWORD 'registry_pass';
GRANT ALL PRIVILEGES ON DATABASE registry_db TO registry_user;
\c registry_db
GRANT ALL ON SCHEMA public TO registry_user;
ALTER SCHEMA public OWNER TO registry_user;
EOF
```

Then restart the service:

```bash
docker-compose restart registry-service
```

## What Happened?

PostgreSQL tried to connect to a database named after the username (`registry_user`) instead of the actual database (`registry_db`). This usually happens when:

1. The database wasn't created during initial setup
2. The DATABASE_URL is incorrectly formatted
3. The Docker container initialized before the database was ready

## Prevention

The updated `docker-compose.yml` now:
- Waits for database to be ready before running migrations
- Adds explicit environment variables for database name
- Has better error handling in startup command

## Verify Fix

```bash
# Check if database exists
docker exec -it registry-postgres psql -U postgres -c "\l" | grep registry_db

# Test connection
docker exec -it registry-postgres psql -U registry_user -d registry_db -c "SELECT current_database();"

# Check service logs
docker-compose logs registry-service | tail -20
```

