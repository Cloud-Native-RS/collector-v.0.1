#!/bin/bash

# Script to update all Dockerfiles from Alpine to Debian Slim
# This fixes Prisma OpenSSL compatibility issues

SERVICES_DIR="services"

echo "🔄 Updating Dockerfiles from Alpine to Debian Slim..."

for dockerfile in $(find "$SERVICES_DIR" -name "Dockerfile"); do
    service_name=$(echo "$dockerfile" | cut -d'/' -f2)
    echo "  📝 Updating $service_name..."
    
    # Backup original
    cp "$dockerfile" "${dockerfile}.alpine.bak"
    
    # Replace Alpine with Debian Slim
    sed -i.tmp 's/node:20-alpine/node:20-slim/g' "$dockerfile"
    
    # Remove Alpine-specific user creation
    sed -i.tmp 's/addgroup -g 1001 -S nodejs.*/groupadd -r nodejs \&\& \\/g' "$dockerfile"
    sed -i.tmp 's/adduser -S nodejs -u 1001/useradd -r -g nodejs nodejs/g' "$dockerfile"
    
    # Add OpenSSL installation for Prisma (after FROM node:20-slim in production stage)
    # Check if OpenSSL install is already present
    if ! grep -q "apt-get install -y openssl" "$dockerfile"; then
        # Find production stage
        awk '
        /^FROM node:20-slim$/ && !seen {
            print
            print ""
            print "# Install OpenSSL for Prisma"
            print "RUN apt-get update && \\"
            print "    apt-get install -y openssl && \\"
            print "    rm -rf /var/lib/apt/lists/*"
            seen=1
            next
        }
        { print }
        ' "$dockerfile" > "${dockerfile}.tmp" && mv "${dockerfile}.tmp" "$dockerfile"
    fi
    
    # Remove tmp files
    rm -f "${dockerfile}.tmp"
    
    echo "    ✅ $service_name updated"
done

echo ""
echo "✅ All Dockerfiles updated!"
echo "📝 Backups saved with .alpine.bak extension"

