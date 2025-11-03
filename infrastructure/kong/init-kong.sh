#!/bin/bash

# Wait for Kong to be ready
echo "Waiting for Kong to be ready..."
until curl -s http://kong:8001/ > /dev/null; do
  sleep 1
done

echo "Kong is ready! Initializing services..."

# Load Kong configuration
kong config db_import /kong/kong.yml

echo "Kong services initialized!"

