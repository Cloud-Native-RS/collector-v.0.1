#!/bin/bash

# Script za generisanje OpenShift manifesta za sve servise
# Koristi registry-service kao template

SERVICES=(
  "orders-service:3002"
  "offers-service:3003"
  "invoices-service:3004"
  "delivery-service:3005"
  "inventory-service:3006"
  "hr-service:3007"
  "project-management-service:3008"
)

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="${BASE_DIR}/services/registry-service"

for service_info in "${SERVICES[@]}"; do
  IFS=':' read -r service_name port <<< "$service_info"
  
  echo "Generating manifests for ${service_name}..."
  
  SERVICE_DIR="${BASE_DIR}/services/${service_name}"
  mkdir -p "${SERVICE_DIR}"
  
  # Deployment
  sed -e "s/registry-service/${service_name}/g" \
      -e "s/3001/${port}/g" \
      -e "s/REGISTRY_DATABASE_URL/${service_name^^}_DATABASE_URL/g" \
      "${TEMPLATE_DIR}/deployment.yaml" > "${SERVICE_DIR}/deployment.yaml"
  
  # Service
  sed -e "s/registry-service/${service_name}/g" \
      -e "s/3001/${port}/g" \
      "${TEMPLATE_DIR}/service.yaml" > "${SERVICE_DIR}/service.yaml"
  
  # Route
  sed -e "s/registry-service/${service_name}/g" \
      "${TEMPLATE_DIR}/route.yaml" > "${SERVICE_DIR}/route.yaml"
  
  # BuildConfig
  sed -e "s/registry-service/${service_name}/g" \
      "${TEMPLATE_DIR}/buildconfig.yaml" > "${SERVICE_DIR}/buildconfig.yaml"
  
  # ServiceAccount
  sed -e "s/registry-service/${service_name}/g" \
      "${TEMPLATE_DIR}/serviceaccount.yaml" > "${SERVICE_DIR}/serviceaccount.yaml"
  
  echo "✓ Generated manifests for ${service_name}"
done

echo ""
echo "All manifests generated successfully!"
echo "Review and customize each service's manifests as needed."

