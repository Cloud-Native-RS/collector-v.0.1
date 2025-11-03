#!/bin/bash

# Initialize Kong Services and Routes
# This script sets up all services in Kong API Gateway

KONG_ADMIN_URL="http://localhost:8001"

echo "Initializing Kong services..."

# Wait for Kong to be ready
echo "Waiting for Kong to be ready..."
until curl -s "${KONG_ADMIN_URL}/" > /dev/null 2>&1; do
  sleep 1
  echo "Waiting for Kong..."
done

echo "Kong is ready!"

# Registry Service
echo "Setting up Registry Service..."
curl -s -X POST "${KONG_ADMIN_URL}/services" \
  --data "name=registry-service" \
  --data "url=http://registry-service:3001" > /dev/null

curl -s -X POST "${KONG_ADMIN_URL}/services/registry-service/routes" \
  --data "name=registry-route" \
  --data "paths[]=/api/registry" \
  --data "paths[]=/api/customers" \
  --data "paths[]=/api/companies" \
  --data "strip_path=true" > /dev/null

# Add plugins to registry service
curl -s -X POST "${KONG_ADMIN_URL}/services/registry-service/plugins" \
  --data "name=rate-limiting" \
  --data "config.minute=100" \
  --data "config.hour=1000" > /dev/null

curl -s -X POST "${KONG_ADMIN_URL}/services/registry-service/plugins" \
  --data "name=cors" > /dev/null

# Invoices Service
echo "Setting up Invoices Service..."
curl -s -X POST "${KONG_ADMIN_URL}/services" \
  --data "name=invoices-service" \
  --data "url=http://invoices-service:3002" > /dev/null

curl -s -X POST "${KONG_ADMIN_URL}/services/invoices-service/routes" \
  --data "name=invoices-route" \
  --data "paths[]=/api/invoices" \
  --data "paths[]=/api/payments" \
  --data "paths[]=/api/dunnings" \
  --data "strip_path=true" > /dev/null

curl -s -X POST "${KONG_ADMIN_URL}/services/invoices-service/plugins" \
  --data "name=rate-limiting" \
  --data "config.minute=100" > /dev/null

# Orders Service
echo "Setting up Orders Service..."
curl -s -X POST "${KONG_ADMIN_URL}/services" \
  --data "name=orders-service" \
  --data "url=http://orders-service:3003" > /dev/null

curl -s -X POST "${KONG_ADMIN_URL}/services/orders-service/routes" \
  --data "name=orders-route" \
  --data "paths[]=/api/orders" \
  --data "strip_path=true" > /dev/null

# Delivery Service
echo "Setting up Delivery Service..."
curl -s -X POST "${KONG_ADMIN_URL}/services" \
  --data "name=delivery-service" \
  --data "url=http://delivery-service:3004" > /dev/null

curl -s -X POST "${KONG_ADMIN_URL}/services/delivery-service/routes" \
  --data "name=delivery-route" \
  --data "paths[]=/api/delivery" \
  --data "paths[]=/api/delivery-notes" \
  --data "strip_path=true" > /dev/null

# Offers Service
echo "Setting up Offers Service..."
curl -s -X POST "${KONG_ADMIN_URL}/services" \
  --data "name=offers-service" \
  --data "url=http://offers-service:3005" > /dev/null

curl -s -X POST "${KONG_ADMIN_URL}/services/offers-service/routes" \
  --data "name=offers-route" \
  --data "paths[]=/api/offers" \
  --data "strip_path=true" > /dev/null

echo "✓ All Kong services initialized!"

