"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Eksplicitno koristimo DATABASE_URL iz environment varijable ako postoji
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || undefined,
        },
    },
});
async function main() {
    console.log('🌱 Seeding Inventory Service database...');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'not set'}`);
    // Cloud Native doo or Softergee doo tenant ID (can be overridden via env)
    const tenantId = process.env.TENANT_ID || 'default-tenant';
    console.log(`   Tenant ID: ${tenantId}`);
    // Clean existing products for this tenant (skip if permission issues)
    console.log('🧹 Cleaning existing products...');
    try {
        await prisma.product.deleteMany({ where: { tenantId } });
        console.log('   ✅ Cleaned existing products');
    }
    catch (error) {
        console.log(`   ⚠️  Could not delete existing products (${error.message}). Continuing with insert...`);
        // Try to continue anyway - new products will be added
    }
    // ==================== PRODUCTS ====================
    console.log('📦 Creating products...');
    const products = await Promise.all([
        // Electronics
        prisma.product.create({
            data: {
                sku: 'LAPTOP-001',
                name: 'Dell XPS 13 Laptop',
                description: 'High-performance laptop with Intel i7, 16GB RAM, 512GB SSD',
                unitOfMeasure: 'PIECE',
                price: 1299.99,
                taxPercent: 20,
                category: 'ELECTRONICS',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'LAPTOP-002',
                name: 'MacBook Pro 16"',
                description: 'Apple MacBook Pro with M2 Pro chip, 32GB RAM, 1TB SSD',
                unitOfMeasure: 'PIECE',
                price: 2499.99,
                taxPercent: 20,
                category: 'ELECTRONICS',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'MOUSE-001',
                name: 'Wireless Mouse Logitech MX Master 3',
                description: 'Ergonomic wireless mouse with precision tracking',
                unitOfMeasure: 'PIECE',
                price: 99.99,
                taxPercent: 20,
                category: 'ELECTRONICS',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'MONITOR-001',
                name: 'LG UltraWide 34" Monitor',
                description: '4K UltraWide curved monitor for productivity',
                unitOfMeasure: 'PIECE',
                price: 599.99,
                taxPercent: 20,
                category: 'ELECTRONICS',
                tenantId,
            },
        }),
        // Clothing
        prisma.product.create({
            data: {
                sku: 'SHIRT-MED-BLUE',
                name: 'Cotton T-Shirt Medium Blue',
                description: '100% organic cotton t-shirt, medium size, blue color',
                unitOfMeasure: 'PIECE',
                price: 25.99,
                taxPercent: 20,
                category: 'CLOTHING',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'SHIRT-LRG-RED',
                name: 'Cotton T-Shirt Large Red',
                description: '100% organic cotton t-shirt, large size, red color',
                unitOfMeasure: 'PIECE',
                price: 25.99,
                taxPercent: 20,
                category: 'CLOTHING',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'JEANS-32-W34',
                name: 'Denim Jeans 32x34',
                description: 'Classic fit denim jeans, waist 32, length 34',
                unitOfMeasure: 'PIECE',
                price: 79.99,
                taxPercent: 20,
                category: 'CLOTHING',
                tenantId,
            },
        }),
        // Food
        prisma.product.create({
            data: {
                sku: 'WATER-BTL-500',
                name: 'Mineral Water Bottle 500ml',
                description: 'Natural mineral water in 500ml bottle',
                unitOfMeasure: 'PIECE',
                price: 1.50,
                taxPercent: 10,
                category: 'FOOD',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'COFFEE-BEANS-1KG',
                name: 'Premium Coffee Beans 1kg',
                description: 'Arabica coffee beans, roasted, 1kg package',
                unitOfMeasure: 'KG',
                price: 24.99,
                taxPercent: 10,
                category: 'FOOD',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'CHOCOLATE-BAR-100G',
                name: 'Dark Chocolate Bar 100g',
                description: 'Organic dark chocolate, 70% cocoa, 100g',
                unitOfMeasure: 'PIECE',
                price: 3.99,
                taxPercent: 10,
                category: 'FOOD',
                tenantId,
            },
        }),
        // Books
        prisma.product.create({
            data: {
                sku: 'BOOK-TECH-001',
                name: 'Clean Code by Robert Martin',
                description: 'Software craftsmanship guide for professional developers',
                unitOfMeasure: 'PIECE',
                price: 45.99,
                taxPercent: 0,
                category: 'BOOKS',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'BOOK-TECH-002',
                name: 'Design Patterns: Elements of Reusable OOP',
                description: 'Classic book on software design patterns',
                unitOfMeasure: 'PIECE',
                price: 54.99,
                taxPercent: 0,
                category: 'BOOKS',
                tenantId,
            },
        }),
        // Furniture
        prisma.product.create({
            data: {
                sku: 'DESK-ERGO-001',
                name: 'Ergonomic Standing Desk',
                description: 'Height-adjustable standing desk, 160cm x 80cm',
                unitOfMeasure: 'PIECE',
                price: 599.99,
                taxPercent: 20,
                category: 'FURNITURE',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'CHAIR-ERGON-001',
                name: 'Ergonomic Office Chair',
                description: 'Comfortable office chair with lumbar support',
                unitOfMeasure: 'PIECE',
                price: 349.99,
                taxPercent: 20,
                category: 'FURNITURE',
                tenantId,
            },
        }),
        // Office Supplies
        prisma.product.create({
            data: {
                sku: 'PEN-BLUE-PACK10',
                name: 'Ballpoint Pen Blue Pack of 10',
                description: 'Standard ballpoint pens, blue ink, pack of 10',
                unitOfMeasure: 'PIECE',
                price: 8.99,
                taxPercent: 20,
                category: 'OFFICE_SUPPLIES',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'NOTEBOOK-A4-100',
                name: 'A4 Notebook 100 pages',
                description: 'A4 size notebook with 100 lined pages',
                unitOfMeasure: 'PIECE',
                price: 5.99,
                taxPercent: 20,
                category: 'OFFICE_SUPPLIES',
                tenantId,
            },
        }),
        // Tools
        prisma.product.create({
            data: {
                sku: 'TOOL-DRILL-001',
                name: 'Cordless Drill Set',
                description: '18V cordless drill with battery and charger',
                unitOfMeasure: 'PIECE',
                price: 149.99,
                taxPercent: 20,
                category: 'TOOLS',
                tenantId,
            },
        }),
    ]);
    // ==================== WAREHOUSES ====================
    console.log('🏭 Creating warehouses...');
    const warehouses = await Promise.all([
        prisma.warehouse.create({
            data: {
                name: 'Main Warehouse',
                location: '123 Industrial Blvd, New York, NY 10001',
                capacity: 10000,
                status: 'ACTIVE',
                tenantId,
            },
        }),
        prisma.warehouse.create({
            data: {
                name: 'Secondary Warehouse',
                location: '456 Commerce St, Los Angeles, CA 90001',
                capacity: 5000,
                status: 'ACTIVE',
                tenantId,
            },
        }),
        prisma.warehouse.create({
            data: {
                name: 'European Distribution Center',
                location: '789 Logistics Park, Amsterdam, Netherlands',
                capacity: 8000,
                status: 'ACTIVE',
                tenantId,
            },
        }),
        prisma.warehouse.create({
            data: {
                name: 'Maintenance Warehouse',
                location: '321 Storage Road, Chicago, IL 60601',
                capacity: 2000,
                status: 'MAINTENANCE',
                tenantId,
            },
        }),
    ]);
    // ==================== STOCK ====================
    console.log('📊 Creating stock records...');
    const stockRecords = [];
    // Create stock for each product in Main Warehouse
    for (const product of products) {
        const minThreshold = product.category === 'FOOD' ? 200 : product.category === 'CLOTHING' ? 20 : 10;
        const reorderLevel = minThreshold * 1.5;
        const initialQty = reorderLevel * 3;
        stockRecords.push(await prisma.stock.create({
            data: {
                productId: product.id,
                warehouseId: warehouses[0].id,
                quantityAvailable: Math.floor(initialQty),
                reservedQuantity: Math.floor(initialQty * 0.1),
                minimumThreshold: minThreshold,
                reorderLevel: Math.floor(reorderLevel),
                reorderQuantity: Math.floor(reorderLevel * 2),
                tenantId,
            },
        }));
    }
    // Add stock for selected products in Secondary Warehouse
    const secondaryProducts = products.slice(0, 8);
    for (const product of secondaryProducts) {
        const minThreshold = product.category === 'FOOD' ? 100 : 5;
        const reorderLevel = minThreshold * 2;
        const initialQty = reorderLevel * 2;
        stockRecords.push(await prisma.stock.create({
            data: {
                productId: product.id,
                warehouseId: warehouses[1].id,
                quantityAvailable: Math.floor(initialQty),
                reservedQuantity: Math.floor(initialQty * 0.05),
                minimumThreshold: minThreshold,
                reorderLevel: Math.floor(reorderLevel),
                reorderQuantity: Math.floor(reorderLevel),
                tenantId,
            },
        }));
    }
    // Add stock for European warehouse
    const europeProducts = products.slice(5, 12);
    for (const product of europeProducts) {
        stockRecords.push(await prisma.stock.create({
            data: {
                productId: product.id,
                warehouseId: warehouses[2].id,
                quantityAvailable: Math.floor(Math.random() * 200 + 50),
                reservedQuantity: 0,
                minimumThreshold: 10,
                reorderLevel: 20,
                reorderQuantity: 50,
                tenantId,
            },
        }));
    }
    // ==================== SUPPLIERS ====================
    console.log('🏢 Creating suppliers...');
    const suppliers = await Promise.all([
        prisma.supplier.create({
            data: {
                name: 'Tech Supplies Co.',
                email: 'orders@techsupplies.com',
                phone: '+1-555-1000',
                address: '789 Tech Avenue',
                city: 'San Francisco',
                country: 'United States',
                taxId: '11-2233445',
                status: 'ACTIVE',
                tenantId,
            },
        }),
        prisma.supplier.create({
            data: {
                name: 'Global Logistics Ltd.',
                email: 'contact@globallogistics.com',
                phone: '+1-555-2000',
                address: '321 Trade Plaza',
                city: 'Chicago',
                country: 'United States',
                taxId: '22-3344556',
                status: 'ACTIVE',
                tenantId,
            },
        }),
        prisma.supplier.create({
            data: {
                name: 'European Wholesale Inc.',
                email: 'sales@eurowholesale.eu',
                phone: '+31-20-1234567',
                address: '456 Business District',
                city: 'Amsterdam',
                country: 'Netherlands',
                taxId: 'NL-123456789B01',
                status: 'ACTIVE',
                tenantId,
            },
        }),
        prisma.supplier.create({
            data: {
                name: 'Textile Manufacturers Ltd.',
                email: 'info@textileman.com',
                phone: '+1-555-3000',
                address: '555 Fabric Street',
                city: 'New York',
                country: 'United States',
                taxId: '33-4455667',
                status: 'ACTIVE',
                tenantId,
            },
        }),
        prisma.supplier.create({
            data: {
                name: 'Food & Beverage Distributors',
                email: 'orders@fbd.com',
                phone: '+1-555-4000',
                address: '888 Grocery Lane',
                city: 'Los Angeles',
                country: 'United States',
                taxId: '44-5566778',
                status: 'ACTIVE',
                tenantId,
            },
        }),
    ]);
    // ==================== PURCHASE ORDERS ====================
    console.log('📋 Creating purchase orders...');
    const purchaseOrders = [];
    // Active PO
    purchaseOrders.push(await prisma.purchaseOrder.create({
        data: {
            poNumber: `PO-2024-${String(Date.now()).slice(-6)}`,
            supplierId: suppliers[0].id,
            status: 'SENT',
            expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            notes: 'Urgent order for laptop inventory',
            tenantId,
            lineItems: {
                create: [
                    {
                        productId: products[0].id,
                        quantity: 20,
                        unitPrice: 1100.00,
                        receivedQuantity: 0,
                        tenantId,
                    },
                    {
                        productId: products[2].id,
                        quantity: 50,
                        unitPrice: 80.00,
                        receivedQuantity: 0,
                        tenantId,
                    },
                ],
            },
        },
    }));
    // Received PO
    purchaseOrders.push(await prisma.purchaseOrder.create({
        data: {
            poNumber: `PO-2024-${String(Date.now() + 1).slice(-6)}`,
            supplierId: suppliers[1].id,
            status: 'RECEIVED',
            expectedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            notes: 'Office supplies received',
            tenantId,
            lineItems: {
                create: [
                    {
                        productId: products[14].id,
                        quantity: 100,
                        unitPrice: 7.50,
                        receivedQuantity: 100,
                        tenantId,
                    },
                    {
                        productId: products[15].id,
                        quantity: 200,
                        unitPrice: 4.50,
                        receivedQuantity: 200,
                        tenantId,
                    },
                ],
            },
        },
    }));
    // Draft PO
    purchaseOrders.push(await prisma.purchaseOrder.create({
        data: {
            poNumber: `PO-2024-${String(Date.now() + 2).slice(-6)}`,
            supplierId: suppliers[2].id,
            status: 'DRAFT',
            expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
            notes: 'Planned order for next month',
            tenantId,
            lineItems: {
                create: [
                    {
                        productId: products[3].id,
                        quantity: 10,
                        unitPrice: 550.00,
                        receivedQuantity: 0,
                        tenantId,
                    },
                ],
            },
        },
    }));
    // ==================== DEVOPS, SUSE, RED HAT & POSTGRESQL SERVICES ====================
    console.log('📦 Creating DevOps, SUSE, Red Hat & PostgreSQL services...');
    const devopsServices = await Promise.all([
        // DevOps Services (1-13)
        prisma.product.create({
            data: {
                sku: 'DEVOPS-CICD-001',
                name: 'CI/CD Pipeline Setup & Configuration',
                description: 'Complete CI/CD pipeline implementation using Jenkins, GitLab CI, or GitHub Actions with automated testing and deployment',
                unitOfMeasure: 'PIECE',
                price: 3500.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'DEVOPS-DOCKER-001',
                name: 'Docker Containerization Service',
                description: 'Application containerization, Dockerfile optimization, and multi-stage build setup for production deployments',
                unitOfMeasure: 'PIECE',
                price: 2800.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'DEVOPS-KUBE-001',
                name: 'Kubernetes Cluster Setup & Management',
                description: 'Kubernetes cluster installation, configuration, and ongoing management with monitoring and auto-scaling',
                unitOfMeasure: 'PIECE',
                price: 5500.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'DEVOPS-MONITOR-001',
                name: 'Infrastructure Monitoring & Alerting',
                description: 'Prometheus, Grafana, or Datadog setup with custom dashboards and alerting rules for infrastructure monitoring',
                unitOfMeasure: 'PIECE',
                price: 3200.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'DEVOPS-IAC-001',
                name: 'Infrastructure as Code (IaC) Implementation',
                description: 'Terraform or Ansible infrastructure automation with best practices and version control integration',
                unitOfMeasure: 'PIECE',
                price: 4000.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'DEVOPS-GIT-001',
                name: 'Git Repository Management & Migration',
                description: 'Git workflow setup, branch strategies, repository migration, and access control configuration',
                unitOfMeasure: 'PIECE',
                price: 1800.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'DEVOPS-HELM-001',
                name: 'Helm Chart Development & Deployment',
                description: 'Custom Helm chart creation, packaging, and deployment for Kubernetes applications',
                unitOfMeasure: 'PIECE',
                price: 2900.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'DEVOPS-AUTOMATE-001',
                name: 'Build & Deployment Automation',
                description: 'Automated build, test, and deployment workflows with quality gates and rollback capabilities',
                unitOfMeasure: 'PIECE',
                price: 3600.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'DEVOPS-SEC-001',
                name: 'DevSecOps Security Integration',
                description: 'Security scanning integration in CI/CD pipelines with vulnerability assessment and compliance checks',
                unitOfMeasure: 'PIECE',
                price: 4200.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'DEVOPS-LOG-001',
                name: 'Centralized Logging Setup',
                description: 'ELK Stack or Loki/Promtail centralized logging implementation with log aggregation and search',
                unitOfMeasure: 'PIECE',
                price: 3100.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'DEVOPS-BACKUP-001',
                name: 'Automated Backup & Disaster Recovery',
                description: 'Automated backup solutions with disaster recovery planning and testing for infrastructure',
                unitOfMeasure: 'PIECE',
                price: 3800.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'DEVOPS-PERF-001',
                name: 'Performance Optimization & Tuning',
                description: 'Infrastructure performance analysis, bottleneck identification, and optimization recommendations',
                unitOfMeasure: 'PIECE',
                price: 3400.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'DEVOPS-CONSULT-001',
                name: 'DevOps Strategy & Consulting',
                description: 'DevOps maturity assessment, strategy development, and implementation roadmap planning',
                unitOfMeasure: 'PIECE',
                price: 4500.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        // SUSE Services (14-26)
        prisma.product.create({
            data: {
                sku: 'SUSE-SLES-001',
                name: 'SUSE Linux Enterprise Server (SLES) Installation',
                description: 'SLES 15 installation, configuration, and initial system setup with security hardening',
                unitOfMeasure: 'PIECE',
                price: 2200.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'SUSE-RANCHER-001',
                name: 'SUSE Rancher Kubernetes Management',
                description: 'Rancher installation and configuration for multi-cluster Kubernetes management and deployment',
                unitOfMeasure: 'PIECE',
                price: 4800.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'SUSE-MANAGER-001',
                name: 'SUSE Manager Server Lifecycle Management',
                description: 'SUSE Manager setup for patch management, system provisioning, and configuration management',
                unitOfMeasure: 'PIECE',
                price: 3900.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'SUSE-HA-001',
                name: 'SUSE Linux Enterprise High Availability',
                description: 'HA cluster setup with Pacemaker and Corosync for mission-critical applications',
                unitOfMeasure: 'PIECE',
                price: 5200.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'SUSE-SAP-001',
                name: 'SUSE Linux Enterprise Server for SAP',
                description: 'SLES for SAP Applications installation, tuning, and optimization for SAP workloads',
                unitOfMeasure: 'PIECE',
                price: 5800.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'SUSE-MIGRATE-001',
                name: 'SUSE Migration & Upgrade Service',
                description: 'Operating system migration to SLES or upgrading between SLES versions with zero downtime',
                unitOfMeasure: 'PIECE',
                price: 4400.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'SUSE-PATCH-001',
                name: 'SUSE Patch Management & Security Updates',
                description: 'Automated patch management, security update deployment, and compliance reporting',
                unitOfMeasure: 'PIECE',
                price: 2600.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'SUSE-KUBERNETES-001',
                name: 'SUSE CaaS Platform Setup',
                description: 'SUSE Container as a Service Platform installation and Kubernetes cluster configuration',
                unitOfMeasure: 'PIECE',
                price: 5100.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'SUSE-SUPPORT-001',
                name: 'SUSE Technical Support & Maintenance',
                description: 'Ongoing technical support, maintenance, and optimization for SUSE Linux Enterprise environments',
                unitOfMeasure: 'PIECE',
                price: 3200.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'SUSE-DOCKER-001',
                name: 'SUSE Linux Enterprise Container Host',
                description: 'SLES Container Host setup with Docker and container runtime optimization',
                unitOfMeasure: 'PIECE',
                price: 2700.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'SUSE-STORAGE-001',
                name: 'SUSE Enterprise Storage Setup',
                description: 'SES (Ceph) installation and configuration for scalable object, block, and file storage',
                unitOfMeasure: 'PIECE',
                price: 5600.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'SUSE-ADMIN-001',
                name: 'SUSE System Administration Training',
                description: 'Comprehensive SLES administration training including YaST, system management, and troubleshooting',
                unitOfMeasure: 'PIECE',
                price: 3800.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'SUSE-CONSULT-001',
                name: 'SUSE Architecture & Design Consulting',
                description: 'SUSE solution architecture design, capacity planning, and best practices consulting',
                unitOfMeasure: 'PIECE',
                price: 4900.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        // Red Hat Services (27-38)
        prisma.product.create({
            data: {
                sku: 'RH-RHEL-001',
                name: 'Red Hat Enterprise Linux (RHEL) Installation',
                description: 'RHEL 8/9 installation, configuration, and system hardening with security compliance',
                unitOfMeasure: 'PIECE',
                price: 2300.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'RH-OPENSHIFT-001',
                name: 'Red Hat OpenShift Container Platform',
                description: 'OpenShift cluster installation, configuration, and application deployment with CI/CD integration',
                unitOfMeasure: 'PIECE',
                price: 6200.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'RH-ANSIBLE-001',
                name: 'Red Hat Ansible Automation Platform',
                description: 'Ansible Tower/AAP setup, playbook development, and automation workflow implementation',
                unitOfMeasure: 'PIECE',
                price: 4700.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'RH-JBOSS-001',
                name: 'Red Hat JBoss EAP/WildFly Setup',
                description: 'JBoss Enterprise Application Platform installation, configuration, and clustering setup',
                unitOfMeasure: 'PIECE',
                price: 4100.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'RH-SATELLITE-001',
                name: 'Red Hat Satellite Server Management',
                description: 'Satellite server installation for patch management, system provisioning, and configuration',
                unitOfMeasure: 'PIECE',
                price: 4500.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'RH-QUAY-001',
                name: 'Red Hat Quay Container Registry',
                description: 'Quay Enterprise installation for secure container image registry and vulnerability scanning',
                unitOfMeasure: 'PIECE',
                price: 3900.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'RH-IDM-001',
                name: 'Red Hat Identity Management (IdM)',
                description: 'IdM setup for centralized authentication, authorization, and certificate management',
                unitOfMeasure: 'PIECE',
                price: 4300.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'RH-CLOUDFORMS-001',
                name: 'Red Hat CloudForms Hybrid Cloud Management',
                description: 'CloudForms installation for unified cloud and infrastructure management across platforms',
                unitOfMeasure: 'PIECE',
                price: 5400.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'RH-GLUSTER-001',
                name: 'Red Hat Gluster Storage Setup',
                description: 'GlusterFS distributed storage installation and configuration for scalable file storage',
                unitOfMeasure: 'PIECE',
                price: 4800.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'RH-MIGRATION-001',
                name: 'Red Hat Migration & Upgrade Service',
                description: 'OS migration to RHEL or RHEL version upgrades with application compatibility testing',
                unitOfMeasure: 'PIECE',
                price: 4600.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'RH-SUPPORT-001',
                name: 'Red Hat Premium Support & Consulting',
                description: '24/7 technical support, proactive monitoring, and expert consulting for Red Hat environments',
                unitOfMeasure: 'PIECE',
                price: 5500.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'RH-TRAINING-001',
                name: 'Red Hat Certification Training',
                description: 'RHCSA/RHCE training courses with hands-on labs and certification exam preparation',
                unitOfMeasure: 'PIECE',
                price: 4200.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        // PostgreSQL Services (39-50)
        prisma.product.create({
            data: {
                sku: 'PG-INSTALL-001',
                name: 'PostgreSQL Installation & Configuration',
                description: 'PostgreSQL server installation, initial configuration, and performance tuning for production',
                unitOfMeasure: 'PIECE',
                price: 2100.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'PG-REPLICATION-001',
                name: 'PostgreSQL Replication Setup',
                description: 'Streaming replication, logical replication, or multi-master setup for high availability',
                unitOfMeasure: 'PIECE',
                price: 3300.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'PG-BACKUP-001',
                name: 'PostgreSQL Backup & Recovery Solution',
                description: 'Automated backup strategy with pg_basebackup, WAL archiving, and point-in-time recovery setup',
                unitOfMeasure: 'PIECE',
                price: 2900.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'PG-PERF-001',
                name: 'PostgreSQL Performance Optimization',
                description: 'Query optimization, index tuning, vacuum analysis, and configuration parameter optimization',
                unitOfMeasure: 'PIECE',
                price: 3600.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'PG-HA-001',
                name: 'PostgreSQL High Availability Cluster',
                description: 'Patroni, repmgr, or Pacemaker HA cluster setup with automatic failover and monitoring',
                unitOfMeasure: 'PIECE',
                price: 4700.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'PG-MIGRATE-001',
                name: 'Database Migration to PostgreSQL',
                description: 'Migration from Oracle, MySQL, SQL Server, or other databases to PostgreSQL with data validation',
                unitOfMeasure: 'PIECE',
                price: 5200.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'PG-PARTITION-001',
                name: 'PostgreSQL Partitioning Implementation',
                description: 'Table partitioning strategy design and implementation (range, list, hash) for large tables',
                unitOfMeasure: 'PIECE',
                price: 3400.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'PG-SECURITY-001',
                name: 'PostgreSQL Security Hardening',
                description: 'Security configuration, role management, SSL/TLS setup, and compliance audit preparation',
                unitOfMeasure: 'PIECE',
                price: 3100.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'PG-MONITOR-001',
                name: 'PostgreSQL Monitoring & Alerting',
                description: 'pg_stat_statements, Prometheus exporters, Grafana dashboards, and custom alerting setup',
                unitOfMeasure: 'PIECE',
                price: 2800.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'PG-EXTENSION-001',
                name: 'PostgreSQL Extension Development',
                description: 'Custom extension development, PostGIS setup, or third-party extension integration',
                unitOfMeasure: 'PIECE',
                price: 4000.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'PG-UPGRADE-001',
                name: 'PostgreSQL Version Upgrade Service',
                description: 'Major version upgrades with minimal downtime using pg_upgrade or logical replication',
                unitOfMeasure: 'PIECE',
                price: 3800.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'PG-ADMIN-001',
                name: 'PostgreSQL Database Administration',
                description: 'Ongoing DBA services including maintenance, tuning, troubleshooting, and capacity planning',
                unitOfMeasure: 'PIECE',
                price: 3200.00,
                taxPercent: 20,
                category: 'OTHER',
                tenantId,
            },
        }),
    ]);
    // Create stock for DevOps/SUSE/RedHat/PostgreSQL services (usluge se ne skladište kao fizički proizvodi)
    console.log('📊 Creating stock records for new services...');
    for (const service of devopsServices) {
        stockRecords.push(await prisma.stock.create({
            data: {
                productId: service.id,
                warehouseId: warehouses[0].id,
                quantityAvailable: 0, // Services don't have physical stock
                reservedQuantity: 0,
                minimumThreshold: 0,
                reorderLevel: 0,
                reorderQuantity: 0,
                tenantId,
            },
        }));
    }
    const totalProducts = products.length + devopsServices.length;
    console.log('✅ Inventory Service seed completed successfully');
    console.log(`   📦 Created ${totalProducts} total products (${products.length} existing + ${devopsServices.length} DevOps/SUSE/RedHat/PostgreSQL services)`);
    console.log(`   🏭 Created ${warehouses.length} warehouses`);
    console.log(`   📊 Created ${stockRecords.length} stock records`);
    console.log(`   🏢 Created ${suppliers.length} suppliers`);
    console.log(`   📋 Created ${purchaseOrders.length} purchase orders`);
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error('❌ Seed failed:');
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
