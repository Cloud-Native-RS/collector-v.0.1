-- Collector Platform - Database Initialization Script
-- This script creates all required databases for microservices

-- Create databases if they don't exist
SELECT 'CREATE DATABASE collector_registry_db' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_registry_db')\gexec

SELECT 'CREATE DATABASE collector_orders_db' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_orders_db')\gexec

SELECT 'CREATE DATABASE collector_invoices_db' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_invoices_db')\gexec

SELECT 'CREATE DATABASE collector_offers_db' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_offers_db')\gexec

SELECT 'CREATE DATABASE collector_inventory_db' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_inventory_db')\gexec

SELECT 'CREATE DATABASE collector_delivery_db' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_delivery_db')\gexec

SELECT 'CREATE DATABASE collector_hr_db' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_hr_db')\gexec

SELECT 'CREATE DATABASE collector_projects_db' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_projects_db')\gexec

SELECT 'CREATE DATABASE collector_crm_db' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collector_crm_db')\gexec

-- Grant permissions
\c collector_registry_db
GRANT ALL ON SCHEMA public TO collector;
ALTER SCHEMA public OWNER TO collector;

\c collector_orders_db
GRANT ALL ON SCHEMA public TO collector;
ALTER SCHEMA public OWNER TO collector;

\c collector_invoices_db
GRANT ALL ON SCHEMA public TO collector;
ALTER SCHEMA public OWNER TO collector;

\c collector_offers_db
GRANT ALL ON SCHEMA public TO collector;
ALTER SCHEMA public OWNER TO collector;

\c collector_inventory_db
GRANT ALL ON SCHEMA public TO collector;
ALTER SCHEMA public OWNER TO collector;

\c collector_delivery_db
GRANT ALL ON SCHEMA public TO collector;
ALTER SCHEMA public OWNER TO collector;

\c collector_hr_db
GRANT ALL ON SCHEMA public TO collector;
ALTER SCHEMA public OWNER TO collector;

\c collector_projects_db
GRANT ALL ON SCHEMA public TO collector;
ALTER SCHEMA public OWNER TO collector;

\c collector_crm_db
GRANT ALL ON SCHEMA public TO collector;
ALTER SCHEMA public OWNER TO collector;

