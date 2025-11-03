import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Cloud Native doo or Softergee doo tenant ID (can be overridden via env)
  const tenantId = process.env.TENANT_ID || 'default-tenant';
  
  // Clean existing data for this tenant
  console.log('🧹 Cleaning existing project data...');
  await prisma.taskResource.deleteMany({ where: { tenantId } });
  await prisma.taskDependency.deleteMany({ where: { tenantId } });
  await prisma.task.deleteMany({ where: { tenantId } });
  await prisma.milestone.deleteMany({ where: { tenantId } });
  await prisma.projectProgress.deleteMany({ where: { tenantId } });
  await prisma.resource.deleteMany({ where: { tenantId } });
  await prisma.project.deleteMany({ where: { tenantId } });
  console.log('   ✅ Cleaned existing data');

  // Create sample project
  const project = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete redesign of company website with modern UI/UX',
      status: 'IN_PROGRESS',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      tenantId,
    },
  });

  console.log('Created project:', project.id);

  // Create milestones
  const milestone1 = await prisma.milestone.create({
    data: {
      projectId: project.id,
      name: 'Design Phase',
      description: 'Complete UI/UX design and mockups',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      tenantId,
    },
  });

  const milestone2 = await prisma.milestone.create({
    data: {
      projectId: project.id,
      name: 'Development Phase',
      description: 'Implement frontend and backend',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      tenantId,
    },
  });

  const milestone3 = await prisma.milestone.create({
    data: {
      projectId: project.id,
      name: 'Testing & Launch',
      description: 'QA testing and production deployment',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      tenantId,
    },
  });

  console.log('Created milestones');

  // Create tasks for milestone 1
  const task1 = await prisma.task.create({
    data: {
      projectId: project.id,
      milestoneId: milestone1.id,
      name: 'Create wireframes',
      description: 'Design wireframes for all pages',
      assignedTo: 'user-1',
      priority: 'HIGH',
      status: 'COMPLETED',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      estimatedHours: 16,
      tenantId,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: project.id,
      milestoneId: milestone1.id,
      name: 'Design mockups',
      description: 'Create high-fidelity mockups',
      assignedTo: 'user-1',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      estimatedHours: 40,
      tenantId,
    },
  });

  // Create tasks for milestone 2
  const task3 = await prisma.task.create({
    data: {
      projectId: project.id,
      milestoneId: milestone2.id,
      name: 'Setup frontend project',
      description: 'Initialize React/Next.js project',
      assignedTo: 'user-2',
      priority: 'MEDIUM',
      status: 'PENDING',
      startDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      estimatedHours: 8,
      tenantId,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      projectId: project.id,
      milestoneId: milestone2.id,
      name: 'Implement components',
      description: 'Build reusable UI components',
      assignedTo: 'user-2',
      priority: 'MEDIUM',
      status: 'PENDING',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
      estimatedHours: 80,
      tenantId,
    },
  });

  // Create task dependencies
  await prisma.taskDependency.create({
    data: {
      dependentTaskId: task4.id,
      dependencyTaskId: task3.id,
      tenantId,
    },
  });

  console.log('Created tasks and dependencies');

  // Create resources
  const resource1 = await prisma.resource.create({
    data: {
      type: 'EMPLOYEE',
      name: 'John Doe',
      userId: 'user-1',
      availabilitySchedule: JSON.stringify({
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
      }),
      tenantId,
    },
  });

  const resource2 = await prisma.resource.create({
    data: {
      type: 'EMPLOYEE',
      name: 'Jane Smith',
      userId: 'user-2',
      availabilitySchedule: JSON.stringify({
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
      }),
      tenantId,
    },
  });

  console.log('Created resources');

  // Allocate resources to tasks
  await prisma.taskResource.create({
    data: {
      taskId: task1.id,
      resourceId: resource1.id,
      allocatedHours: 16,
      tenantId,
    },
  });

  await prisma.taskResource.create({
    data: {
      taskId: task2.id,
      resourceId: resource1.id,
      allocatedHours: 40,
      tenantId,
    },
  });

  await prisma.taskResource.create({
    data: {
      taskId: task3.id,
      resourceId: resource2.id,
      allocatedHours: 8,
      tenantId,
    },
  });

  await prisma.taskResource.create({
    data: {
      taskId: task4.id,
      resourceId: resource2.id,
      allocatedHours: 80,
      tenantId,
    },
  });

  console.log('Allocated resources to tasks');

  // ==================== ADDITIONAL PROJECTS (49 more to reach 50 total) ====================
  console.log('📁 Creating additional 49 projects to reach 50 total...');
  const projectStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
  const projectNames = [
    'Mobile App Development',
    'Cloud Migration',
    'E-commerce Platform',
    'Data Analytics Dashboard',
    'API Integration',
    'Security Audit',
    'Content Management System',
    'Customer Portal',
    'Automation System',
    'Quality Assurance',
    'Infrastructure Upgrade',
    'Marketing Campaign',
    'Product Launch',
    'Training Program',
    'Research & Development',
    'System Maintenance',
    'Feature Enhancement',
    'Bug Fix Sprint',
    'Performance Optimization',
    'Documentation Project',
    'Compliance Review',
    'Partnership Integration',
    'Brand Refresh',
    'Market Expansion',
    'Website Redesign',
    'Database Migration',
    'CRM Implementation',
    'ERP Integration',
    'BI Dashboard',
    'Mobile Backend',
    'Payment Gateway',
    'Inventory System',
    'HR Platform',
    'Customer Support',
    'Analytics Platform',
    'AI Integration',
    'Blockchain Project',
    'IoT Development',
    'Cybersecurity',
    'DevOps Pipeline',
    'Microservices',
    'API Gateway',
    'Event Streaming',
    'Data Warehouse',
    'Machine Learning',
    'Chatbot Development',
    'Video Platform',
    'Social Media',
    'E-learning Platform',
    'Healthcare System',
  ];

  const additionalProjects = [];
  for (let i = 0; i < 49; i++) {
    const startDate = new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + Math.floor(Math.random() * 90 + 30) * 24 * 60 * 60 * 1000);
    const status = projectStatuses[i % projectStatuses.length] as any;

    const newProject = await prisma.project.create({
      data: {
        name: projectNames[i],
        description: `Project description for ${projectNames[i]}`,
        clientId: i % 5 === 0 ? `client-${i % 10}` : null,
        status,
        startDate,
        endDate: status !== 'PLANNED' && status !== 'CANCELLED' ? endDate : null,
        tenantId,
        milestones: {
          create: [
            {
              name: `Milestone 1 - ${projectNames[i]}`,
              description: 'First milestone',
              dueDate: new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000),
              status: 'PENDING',
              tenantId,
            },
            {
              name: `Milestone 2 - ${projectNames[i]}`,
              description: 'Second milestone',
              dueDate: new Date(startDate.getTime() + 60 * 24 * 60 * 60 * 1000),
              status: 'PENDING',
              tenantId,
            },
          ],
        },
        tasks: {
          create: [
            {
              name: `Task 1 - ${projectNames[i]}`,
              description: 'Initial task',
              assignedTo: `user-${(i % 3) + 1}`,
              priority: 'MEDIUM',
              status: 'PENDING',
              startDate: startDate,
              dueDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
              estimatedHours: 8,
              tenantId,
            },
          ],
        },
      },
    });
    additionalProjects.push(newProject);
  }

  console.log(`✅ Created ${additionalProjects.length + 1} total projects (including initial project)`);
  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

