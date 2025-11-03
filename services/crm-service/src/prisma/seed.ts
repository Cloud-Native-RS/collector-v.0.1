import { PrismaClient, LeadSource, LeadStatus, TaskType, TaskStatus, TaskPriority, DealStage, ActivityType } from '@prisma/client';
import { generateLeadNumber, generateDealNumber } from '../utils/number-generator';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CRM Service database...');

  // Clean existing data (optional - uncomment if you want to reset)
  // await prisma.activity.deleteMany({});
  // await prisma.task.deleteMany({});
  // await prisma.deal.deleteMany({});
  // await prisma.lead.deleteMany({});

  // Cloud Native doo or Softergee doo tenant ID (can be overridden via env)
  const tenantId = process.env.TENANT_ID || 'default-tenant';
  const userId = 'user-1'; // Mock user ID
  
  // Clean existing data for this tenant (ignore errors if tables don't exist)
  console.log('🧹 Cleaning existing CRM data...');
  try {
    await prisma.activity.deleteMany({ where: { tenantId } });
  } catch (e: any) {
    if (e.code !== 'P2021') throw e; // P2021 = table does not exist
  }
  try {
    await prisma.task.deleteMany({ where: { tenantId } });
  } catch (e: any) {
    if (e.code !== 'P2021') throw e;
  }
  try {
    await prisma.deal.deleteMany({ where: { tenantId } });
  } catch (e: any) {
    if (e.code !== 'P2021') throw e;
  }
  try {
    await prisma.lead.deleteMany({ where: { tenantId } });
  } catch (e: any) {
    if (e.code !== 'P2021') throw e;
  }
  console.log('   ✅ Cleaned existing data');

  // ==================== LEADS ====================
  console.log('📋 Creating leads...');
  
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        leadNumber: generateLeadNumber(),
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1-555-0101',
        company: 'Tech Innovations Inc.',
        companyType: 'LLC',
        companyIndustry: 'Technology',
        source: LeadSource.WEBSITE,
        status: LeadStatus.NEW,
        value: 50000,
        assignedTo: userId,
        notes: 'Interested in enterprise solutions',
        tenantId,
      },
    }),
    prisma.lead.create({
      data: {
        leadNumber: generateLeadNumber(),
        name: 'Sarah Johnson',
        email: 'sarah.j@company.com',
        phone: '+1-555-0102',
        company: 'Global Services Ltd',
        companyType: 'CORPORATION',
        companyIndustry: 'Services',
        source: LeadSource.REFERRAL,
        status: LeadStatus.CONTACTED,
        value: 75000,
        assignedTo: userId,
        notes: 'Referred by existing customer',
        tenantId,
      },
    }),
    prisma.lead.create({
      data: {
        leadNumber: generateLeadNumber(),
        name: 'Michael Brown',
        email: 'michael.brown@startup.io',
        phone: '+1-555-0103',
        company: 'StartupXYZ',
        companyType: 'LLC',
        companyIndustry: 'Technology',
        source: LeadSource.SOCIAL,
        status: LeadStatus.QUALIFIED,
        value: 30000,
        assignedTo: userId,
        notes: 'Early stage startup, needs MVP',
        tenantId,
      },
    }),
    prisma.lead.create({
      data: {
        leadNumber: generateLeadNumber(),
        name: 'Emma Wilson',
        email: 'emma.w@bigcorp.com',
        phone: '+1-555-0104',
        company: 'BigCorp Industries',
        companyType: 'CORPORATION',
        companyIndustry: 'Manufacturing',
        source: LeadSource.EMAIL,
        status: LeadStatus.PROPOSAL_SENT,
        value: 150000,
        assignedTo: userId,
        notes: 'Large enterprise client, proposal sent',
        tenantId,
      },
    }),
    prisma.lead.create({
      data: {
        leadNumber: generateLeadNumber(),
        name: 'David Lee',
        email: 'david.lee@smallbiz.com',
        phone: '+1-555-0105',
        company: 'SmallBiz Solutions',
        companyType: 'LLC',
        companyIndustry: 'Retail',
        source: LeadSource.CALL,
        status: LeadStatus.NEGOTIATION,
        value: 25000,
        assignedTo: userId,
        notes: 'Negotiating pricing and terms',
        tenantId,
      },
    }),
  ]);

  console.log(`   ✅ Created ${leads.length} leads`);

  // ==================== DEALS ====================
  console.log('💼 Creating deals...');

  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        dealNumber: generateDealNumber(),
        title: 'Enterprise Software License',
        description: 'Multi-year enterprise license for Tech Innovations',
        value: 50000,
        probability: 75,
        stage: DealStage.NEGOTIATION,
        expectedCloseDate: new Date('2024-12-31'),
        leadId: leads[0].id,
        assignedTo: userId,
        tenantId,
      },
    }),
    prisma.deal.create({
      data: {
        dealNumber: generateDealNumber(),
        title: 'Global Services Partnership',
        description: 'Strategic partnership with Global Services Ltd',
        value: 75000,
        probability: 60,
        stage: DealStage.PROPOSAL,
        expectedCloseDate: new Date('2025-01-15'),
        leadId: leads[1].id,
        assignedTo: userId,
        tenantId,
      },
    }),
    prisma.deal.create({
      data: {
        dealNumber: generateDealNumber(),
        title: 'Startup MVP Development',
        description: 'MVP development project for StartupXYZ',
        value: 30000,
        probability: 40,
        stage: DealStage.QUALIFIED,
        expectedCloseDate: new Date('2025-02-01'),
        leadId: leads[2].id,
        assignedTo: userId,
        tenantId,
      },
    }),
  ]);

  console.log(`   ✅ Created ${deals.length} deals`);

  // ==================== TASKS ====================
  console.log('📝 Creating tasks...');

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Follow up with John Smith',
        description: 'Schedule demo call for enterprise solutions',
        type: TaskType.CALL,
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-12-20'),
        assignedTo: userId,
        leadId: leads[0].id,
        tenantId,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Send proposal to Emma Wilson',
        description: 'Prepare and send detailed proposal for BigCorp',
        type: TaskType.EMAIL,
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.URGENT,
        dueDate: new Date('2024-12-15'),
        completedAt: new Date('2024-12-14'),
        assignedTo: userId,
        leadId: leads[3].id,
        tenantId,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Meeting with David Lee',
        description: 'Discuss pricing and contract terms',
        type: TaskType.MEETING,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-12-22'),
        assignedTo: userId,
        dealId: deals[0].id,
        tenantId,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Qualification call with StartupXYZ',
        description: 'Understand requirements and budget',
        type: TaskType.CALL,
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date('2024-12-10'),
        completedAt: new Date('2024-12-09'),
        leadId: leads[2].id,
        tenantId,
      },
    }),
  ]);

  console.log(`   ✅ Created ${tasks.length} tasks`);

  // ==================== ACTIVITIES ====================
  console.log('📊 Creating activities...');

  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        type: ActivityType.CALL,
        title: 'Initial discovery call',
        description: 'Discussed company needs and requirements',
        notes: 'John was very interested in our enterprise solution. Follow up needed.',
        duration: 30,
        userId: userId,
        leadId: leads[0].id,
        tenantId,
      },
    }),
    prisma.activity.create({
      data: {
        type: ActivityType.EMAIL,
        title: 'Proposal sent',
        description: 'Sent detailed proposal document',
        notes: 'Proposal included pricing, features, and implementation timeline',
        userId: userId,
        leadId: leads[3].id,
        tenantId,
      },
    }),
    prisma.activity.create({
      data: {
        type: ActivityType.MEETING,
        title: 'Negotiation meeting',
        description: 'Met with David to discuss contract terms',
        notes: 'Discussed pricing options and payment terms. Moving forward.',
        duration: 60,
        userId: userId,
        dealId: deals[0].id,
        tenantId,
      },
    }),
    prisma.activity.create({
      data: {
        type: ActivityType.NOTE,
        title: 'Qualification notes',
        description: 'Initial qualification assessment',
        notes: 'StartupXYZ has limited budget but good growth potential. Consider flexible pricing.',
        userId: userId,
        leadId: leads[2].id,
        tenantId,
      },
    }),
  ]);

  console.log(`   ✅ Created ${activities.length} activities`);

  // ==================== ADDITIONAL LEADS (45 more to reach 50 total) ====================
  console.log('📋 Creating additional 45 leads to reach 50 total...');
  const additionalLeads = [];
  const leadStatuses: LeadStatus[] = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.PROPOSAL_SENT, LeadStatus.NEGOTIATION, LeadStatus.WON, LeadStatus.LOST];
  const leadSources = [LeadSource.WEBSITE, LeadSource.SOCIAL, LeadSource.EMAIL, LeadSource.CALL, LeadSource.REFERRAL, LeadSource.OTHER];
  const firstNames = ['James', 'Emma', 'Oliver', 'Sophia', 'William', 'Isabella', 'Mason', 'Olivia', 'Lucas', 'Ava'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const companies = ['Tech Corp', 'Innovation Ltd', 'Solutions Inc', 'Global Services', 'Digital Systems', 'Modern Tech', 'Future Works', 'Smart Solutions', 'Next Gen', 'Advanced Systems'];
  const industries = ['Technology', 'Manufacturing', 'Consulting', 'Retail', 'Finance', 'Healthcare', 'Education', 'Real Estate', 'Logistics', 'Energy'];

  for (let i = 0; i < 45; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    additionalLeads.push(
      prisma.lead.create({
        data: {
          leadNumber: generateLeadNumber(),
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
          phone: `+1-555-${String(2000 + i).padStart(4, '0')}`,
          company: `${companies[i % companies.length]} ${i + 1}`,
          companyType: ['LLC', 'CORPORATION', 'LTD', 'INC'][i % 4],
          companyIndustry: industries[i % industries.length],
          source: leadSources[i % leadSources.length],
          status: leadStatuses[i % leadStatuses.length],
          value: (i + 1) * 2000,
          assignedTo: userId,
          notes: `Lead notes for ${firstName} ${lastName} from ${companies[i % companies.length]}`,
          tenantId,
        },
      })
    );
  }
  const allLeads = [...leads, ...(await Promise.all(additionalLeads))];

  // ==================== ADDITIONAL DEALS (47 more to reach 50 total) ====================
  console.log('💼 Creating additional 47 deals to reach 50 total...');
  const additionalDeals = [];
  const dealStages = [DealStage.LEAD, DealStage.QUALIFIED, DealStage.PROPOSAL, DealStage.NEGOTIATION, DealStage.CLOSED_WON, DealStage.CLOSED_LOST];
  
  for (let i = 0; i < 47; i++) {
    additionalDeals.push(
      prisma.deal.create({
        data: {
          dealNumber: generateDealNumber(),
          title: `Deal ${i + 6}`,
          description: `Description for deal ${i + 6}`,
          value: (i + 6) * 5000,
          probability: (i % 5) * 20,
          stage: dealStages[i % dealStages.length],
          expectedCloseDate: new Date(Date.now() + (i % 90) * 24 * 60 * 60 * 1000),
          leadId: allLeads[i % allLeads.length].id,
          assignedTo: userId,
          tenantId,
        },
      })
    );
  }
  const allDeals = [...deals, ...(await Promise.all(additionalDeals))];

  // ==================== ADDITIONAL ACTIVITIES (46 more to reach 50 total) ====================
  console.log('📊 Creating additional 46 activities to reach 50 total...');
  const additionalActivities = [];
  const activityTypes = [ActivityType.CALL, ActivityType.EMAIL, ActivityType.MEETING, ActivityType.NOTE];
  
  for (let i = 0; i < 46; i++) {
    additionalActivities.push(
      prisma.activity.create({
        data: {
          type: activityTypes[i % activityTypes.length],
          title: `Activity ${i + 5}`,
          description: `Description for activity ${i + 5}`,
          notes: `Activity notes ${i + 5}`,
          duration: (i % 60) + 15,
          userId: userId,
          leadId: allLeads[i % allLeads.length].id,
          dealId: i % 2 === 0 ? allDeals[i % allDeals.length].id : null,
          tenantId,
        },
      })
    );
  }
  await Promise.all(additionalActivities);

  console.log('✅ Seeding completed successfully!');
  console.log(`   - ${allLeads.length} leads`);
  console.log(`   - ${allDeals.length} deals`);
  console.log(`   - ${tasks.length} tasks`);
  console.log(`   - ${activities.length + 46} activities`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

