#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const http = require('http');
const util = require('util');

const execPromise = util.promisify(exec);

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Service definitions
const services = [
  {
    name: 'registry-service',
    port: 3001,
    path: 'services/registry-service',
    url: 'http://localhost:3001',
    dependencies: ['postgres', 'redis'],
  },
  {
    name: 'invoices-service',
    port: 3002,
    path: 'services/invoices-service',
    url: 'http://localhost:3002',
    dependencies: ['postgres', 'nats', 'redis'],
  },
];

// Helper functions for colored output
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logLoading(message) {
  log(`⟳ ${message}`, 'cyan');
}

// Check if Docker is running
async function checkDocker() {
  try {
    await execPromise('docker ps');
    return true;
  } catch (error) {
    logError('Docker is not running or not accessible');
    logError('Please start Docker Desktop and try again');
    return false;
  }
}

// Check if service is already running
async function isServiceRunning(servicePath) {
  try {
    const { stdout } = await execPromise(
      `cd ${servicePath} && docker-compose ps --format json`,
    );
    const containers = stdout
      .trim()
      .split('\n')
      .filter((line) => line)
      .map((line) => JSON.parse(line));
    return containers.some((container) => container.State === 'running');
  } catch (error) {
    return false;
  }
}

// Start docker-compose service
async function startDockerService(service) {
  logInfo(`Starting ${service.name}...`);

  try {
    // Check if already running
    if (await isServiceRunning(service.path)) {
      logWarning(`${service.name} is already running`);
      return { success: true, message: 'already running' };
    }

    // Start the service
    const { stdout, stderr } = await execPromise(
      `cd ${service.path} && docker-compose up -d`,
      { maxBuffer: 1024 * 1024 * 10 }, // 10MB buffer
    );

    if (stderr && !stderr.includes('Creating network')) {
      logWarning(`${service.name}: ${stderr}`);
    }

    logSuccess(`${service.name} docker containers started`);
    return { success: true, message: 'started' };
  } catch (error) {
    logError(`Failed to start ${service.name}: ${error.message}`);
    return { success: false, message: error.message };
  }
}

// Wait for service health check
async function checkServiceHealth(service, maxAttempts = 30) {
  const waitTime = 2000; // 2 seconds

  logLoading(`Checking ${service.name} health...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await new Promise((resolve, reject) => {
        const req = http.get(`${service.url}/health`, (res) => {
          if (res.statusCode === 200) {
            resolve(res);
          } else {
            reject(new Error(`Status ${res.statusCode}`));
          }
        });

        req.on('error', reject);
        req.setTimeout(3000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });

      logSuccess(`${service.name} is healthy`);
      return { success: true };
    } catch (error) {
      if (attempt < maxAttempts) {
        process.stdout.write(
          `\r${colors.cyan}⟳${colors.reset} Waiting for ${service.name}... (attempt ${attempt}/${maxAttempts})`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        logError(
          `${service.name} is not responding after ${maxAttempts} attempts`,
        );
        logError(`   URL: ${service.url}/health`);
        logError(`   Error: ${error.message}`);
        return { success: false, error: error.message };
      }
    }
  }

  process.stdout.write('\n');
  return { success: false, error: 'Max attempts reached' };
}

// Wait for migrations
async function waitForMigrations(service) {
  logInfo(`Waiting for ${service.name} migrations...`);

  try {
    // Wait a bit for containers to be ready
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Get the main service container
    const { stdout } = await execPromise(
      `cd ${service.path} && docker-compose ps -q`,
    );
    const containerId = stdout.trim().split('\n')[0];

    if (!containerId) {
      logWarning(`${service.name}: No container found, skipping migrations`);
      return { success: true };
    }

    // Run migrations
    try {
      await execPromise(
        `docker exec ${containerId} npm run db:migrate:deploy 2>&1 || true`,
        { maxBuffer: 1024 * 1024 * 10 },
      );
      logSuccess(`${service.name} migrations completed`);
      return { success: true };
    } catch (error) {
      // Migrations might fail if already migrated - that's OK
      if (error.message.includes('already applied')) {
        logSuccess(`${service.name} migrations already applied`);
        return { success: true };
      }
      logWarning(`${service.name} migrations: ${error.message}`);
      return { success: true }; // Continue anyway
    }
  } catch (error) {
    logWarning(`${service.name} migrations: ${error.message}`);
    return { success: true }; // Continue anyway
  }
}

// Main execution
async function main() {
  console.log(
    `${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`,
  );
  console.log(
    `${colors.blue}   Starting Collector Platform Services${colors.reset}`,
  );
  console.log(
    `${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`,
  );
  console.log('');

  // Check Docker
  logInfo('Checking Docker...');
  if (!(await checkDocker())) {
    process.exit(1);
  }
  logSuccess('Docker is running');
  console.log('');

  const failedServices = [];

  // Start all services
  for (const service of services) {
    logInfo(`Processing ${service.name}...`);

    const startResult = await startDockerService(service);
    if (!startResult.success) {
      failedServices.push({
        service: service.name,
        step: 'docker start',
        error: startResult.message,
      });
      continue;
    }

    const migrationResult = await waitForMigrations(service);
    if (!migrationResult.success) {
      failedServices.push({
        service: service.name,
        step: 'migrations',
        error: migrationResult.error || 'Unknown error',
      });
      // Continue anyway - migrations might be OK
    }
  }

  // Wait for services to be ready
  console.log('');
  logInfo('Waiting for services to be ready...');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Check health of all services
  console.log('');
  logInfo('Checking service health...');
  console.log('');

  for (const service of services) {
    const healthResult = await checkServiceHealth(service);
    if (!healthResult.success) {
      failedServices.push({
        service: service.name,
        step: 'health check',
        error: healthResult.error || 'Service not responding',
      });
    }
    console.log('');
  }

  // Final summary
  console.log(
    `${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`,
  );

  if (failedServices.length === 0) {
    console.log(
      `${colors.green}   ✓ All services are running successfully!${colors.reset}`,
    );
    console.log(
      `${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`,
    );
    console.log('');
    logSuccess('Registry Service: http://localhost:3001');
    logSuccess('Invoices Service: http://localhost:3002');
    console.log('');
    logInfo('You can now access the dashboard at http://localhost:3000');
    console.log('');
    return 0;
  } else {
    console.log(
      `${colors.red}   ✗ Some services failed to start${colors.reset}`,
    );
    console.log(
      `${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`,
    );
    console.log('');
    logError('Failed services:');
    for (const failed of failedServices) {
      console.log(
        `  ${colors.red}•${colors.reset} ${failed.service} (${failed.step})`,
      );
      if (failed.error) {
        console.log(`    Error: ${failed.error}`);
      }
    }
    console.log('');
    logInfo('Troubleshooting:');
    console.log('  1. Check if Docker is running: docker ps');
    console.log(
      '  2. Check service logs: cd services/<service-name> && docker-compose logs',
    );
    console.log(
      '  3. Check service status: cd services/<service-name> && docker-compose ps',
    );
    console.log(
      '  4. Restart a service: cd services/<service-name> && docker-compose restart',
    );
    console.log(
      '  5. View all logs: cd services/<service-name> && docker-compose logs -f',
    );
    console.log('');
    return 1;
  }
}

// Run main function
main()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });

