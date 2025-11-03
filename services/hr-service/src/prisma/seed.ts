import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Cloud Native doo or Softergee doo tenant ID (can be overridden via env)
  const tenantId = process.env.TENANT_ID || 'seed-tenant-1';
  
  // Clean existing data for this tenant
  console.log('🧹 Cleaning existing HR data...');
  await prisma.attendance.deleteMany({ where: { tenantId } });
  await prisma.payroll.deleteMany({ where: { tenantId } });
  await prisma.applicant.deleteMany({ where: { tenantId } });
  await prisma.jobPosting.deleteMany({ where: { tenantId } });
  await prisma.employee.deleteMany({ where: { tenantId } });
  console.log('   ✅ Cleaned existing data');

  // Create employees
  const manager = await prisma.employee.create({
    data: {
      firstName: 'John',
      lastName: 'Manager',
      email: 'john.manager@example.com',
      phone: '+1234567890',
      jobTitle: 'HR Manager',
      department: 'Human Resources',
      employmentType: 'FULL_TIME',
      startDate: new Date('2020-01-01'),
      tenantId,
    },
  });

  const employee = await prisma.employee.create({
    data: {
      firstName: 'Jane',
      lastName: 'Employee',
      email: 'jane.employee@example.com',
      phone: '+1234567891',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      employmentType: 'FULL_TIME',
      startDate: new Date('2022-01-15'),
      managerId: manager.id,
      tenantId,
    },
  });

  // Create attendance records
  await prisma.attendance.create({
    data: {
      employeeId: employee.id,
      date: new Date(),
      checkInTime: new Date(),
      status: 'PRESENT',
      tenantId,
    },
  });

  // Create payroll record
  await prisma.payroll.create({
    data: {
      employeeId: employee.id,
      salaryBase: 5000,
      bonuses: 500,
      deductions: 1000,
      taxes: 800,
      netPay: 3700,
      payPeriodStart: new Date('2024-01-01'),
      payPeriodEnd: new Date('2024-01-31'),
      status: 'PROCESSED',
      paymentDate: new Date('2024-02-01'),
      tenantId,
    },
  });

  // Create job posting
  const jobPosting = await prisma.jobPosting.create({
    data: {
      title: 'Senior Software Engineer',
      description: 'We are looking for an experienced software engineer...',
      department: 'Engineering',
      location: 'Remote',
      status: 'OPEN',
      postedDate: new Date(),
      tenantId,
    },
  });

  // Create applicant
  await prisma.applicant.create({
    data: {
      jobPostingId: jobPosting.id,
      applicantName: 'John Applicant',
      email: 'john.applicant@example.com',
      phone: '+1234567892',
      status: 'APPLIED',
      tenantId,
    },
  });

  // ==================== ADDITIONAL EMPLOYEES (48 more to reach 50 total) ====================
  console.log('👥 Creating additional 48 employees to reach 50 total...');
  const employmentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN', 'TEMPORARY'];
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Product', 'Support', 'Design', 'Legal'];
  const jobTitles = [
    'Software Engineer', 'Senior Software Engineer', 'Product Manager', 'Designer',
    'Sales Manager', 'Marketing Specialist', 'HR Coordinator', 'Financial Analyst',
    'Operations Manager', 'Customer Support', 'DevOps Engineer', 'QA Engineer',
    'Business Analyst', 'Accountant', 'Lawyer', 'Data Scientist', 'Frontend Developer',
    'Backend Developer', 'Full Stack Developer', 'Project Manager', 'Scrum Master',
    'UI/UX Designer', 'Content Writer',
  ];

  const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Laura', 'Tom', 'Anna', 'James', 'Lisa', 'Mark', 'Karen', 'Steve', 'Nancy', 'Ryan', 'Michelle', 'Kevin', 'Jessica', 'Brian', 'Ashley', 'Daniel'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris'];

  const additionalEmployees = [];
  for (let i = 0; i < 48; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const employmentType = employmentTypes[i % employmentTypes.length] as any;
    const department = departments[i % departments.length];
    const jobTitle = jobTitles[i % jobTitles.length];
    const startDate = new Date(Date.now() - Math.floor(Math.random() * 365 * 3) * 24 * 60 * 60 * 1000);
    
    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email,
        phone: `+1-555-${String(1000 + i).padStart(4, '0')}`,
        jobTitle,
        department,
        employmentType,
        startDate,
        managerId: i > 5 ? manager.id : null,
        tenantId,
      },
    });
    additionalEmployees.push(employee);
  }

  console.log(`✅ Created ${additionalEmployees.length + 2} total employees (50 total)`);
  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

