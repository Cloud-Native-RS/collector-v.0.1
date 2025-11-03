#!/usr/bin/env tsx
/**
 * Master Seed Script for Cloud Native doo and Softergee doo Tenants
 * Creates 50 objects of each type for both tenants
 * 
 * Usage: tsx scripts/seed-all-tenants.ts
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TENANTS = [
  { name: 'cloud-native-doo', id: '217e632c-3c60-4bc4-935e-25297db24ae3', displayName: 'Cloud Native doo' },
  { name: 'softergee-doo', id: '77a3fd30-6178-4830-a56b-d9d07057c2ee', displayName: 'Softergee doo' },
];

const SERVICES = [
  { name: 'registry-service', container: 'collector-account-registry', seedFile: 'services/registry-service/src/prisma/seed.ts' },
  { name: 'crm-service', container: 'collector-account-crm', seedFile: 'services/crm-service/src/prisma/seed.ts' },
  { name: 'offers-service', container: 'collector-account-offers', seedFile: 'services/offers-service/src/prisma/seed.ts' },
  { name: 'orders-service', container: 'collector-account-orders', seedFile: 'services/orders-service/src/prisma/seed.ts' },
  { name: 'invoices-service', container: 'collector-account-invoices', seedFile: 'services/invoices-service/src/prisma/seed.ts' },
  { name: 'inventory-service', container: 'collector-account-inventory', seedFile: 'services/inventory-service/src/prisma/seed.ts' },
  { name: 'project-management-service', container: 'collector-account-pm', seedFile: 'services/project-management-service/src/prisma/seed.ts' },
  { name: 'hr-service', container: 'collector-account-hr', seedFile: 'services/hr-service/src/prisma/seed.ts' },
];

async function main() {
  console.log('🌱 Starting Master Seed Script for Cloud Native doo and Softergee doo\n');

  for (const tenant of TENANTS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 Seeding ${tenant.displayName} (${tenant.name})`);
    console.log(`${'='.repeat(60)}\n`);

    // Seed each service for this tenant
    for (const service of SERVICES) {
      await seedServiceForTenant(service, tenant);
    }

    console.log(`\n✅ Completed seeding for ${tenant.displayName}\n`);
  }

  console.log('✅ Master seed completed successfully!');
}

async function seedServiceForTenant(
  service: { name: string; container: string; seedFile: string },
  tenant: { name: string; id: string; displayName: string }
) {
  console.log(`📦 [${tenant.displayName}] Seeding ${service.name}...`);

  // Check if container is running
  try {
    const containers = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf-8' });
    if (!containers.includes(service.container)) {
      console.log(`   ⚠️  Container ${service.container} not running, skipping...`);
      return;
    }
  } catch (error) {
    console.log(`   ⚠️  Docker not available, skipping...`);
    return;
  }

  // Update seed file with tenant ID
  try {
    const seedPath = join(process.cwd(), service.seedFile);
    let seedContent = readFileSync(seedPath, 'utf-8');
    
    // Replace tenant ID patterns
    const oldPatterns = [
      /const tenantId = ['"]default-tenant['"];?/g,
      /const tenantId = ['"]seed-tenant-1['"];?/g,
      /tenantId:\s*['"]default-tenant['"]/g,
    ];
    
    for (const pattern of oldPatterns) {
      seedContent = seedContent.replace(pattern, `const tenantId = '${tenant.id}';`);
    }
    
    // Write updated seed file
    writeFileSync(seedPath, seedContent, 'utf-8');
    
    // Copy to container and run
    execSync(`docker cp "${seedPath}" ${service.container}:/app/seed.ts`, { stdio: 'inherit' });
    
    // Run seed
    const result = execSync(
      `docker exec ${service.container} sh -c "cd /app && npx tsx seed.ts || npm run db:seed || npx tsx src/prisma/seed.ts"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    if (result.includes('✅') || result.includes('Created') || result.includes('completed')) {
      console.log(`   ✅ ${service.name} seeded successfully`);
    } else {
      console.log(`   ⚠️  ${service.name} seed may have issues`);
      console.log(`   Output: ${result.substring(0, 200)}...`);
    }
  } catch (error: any) {
    console.log(`   ❌ ${service.name} seed failed: ${error.message}`);
  }
}

main().catch((error) => {
  console.error('❌ Master seed failed:', error);
  process.exit(1);
});

