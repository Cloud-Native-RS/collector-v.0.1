import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Registry Service database...');

  // Clean existing data for Cloud Native doo tenant only
  // Note: This will delete customers, companies, addresses, contacts, and bank accounts
  // but will preserve tenants and users
  console.log('🧹 Cleaning existing seed data...');
  await prisma.customer.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.bankAccount.deleteMany({});
  console.log('   ✅ Cleaned existing data');

  // ==================== TENANTS ====================
  console.log('🏢 Creating tenants (companies)...');
  const tenants = await Promise.all([
    prisma.tenant.upsert({
      where: { name: 'cloud-native-doo' },
      update: {},
      create: {
        name: 'cloud-native-doo',
        displayName: 'Cloud Native doo',
        isActive: true,
      },
    }),
    prisma.tenant.upsert({
      where: { name: 'softergee-doo' },
      update: {},
      create: {
        name: 'softergee-doo',
        displayName: 'Softergee doo',
        isActive: true,
      },
    }),
    // Removed digital-solutions-doo tenant - only keeping cloud-native-doo and softergee-doo
  ]);

  console.log(`   ✅ Created ${tenants.length} tenants`);
  
  const cloudNativeTenant = tenants.find(t => t.name === 'cloud-native-doo')!;
  const softergeeTenant = tenants.find(t => t.name === 'softergee-doo')!;

  // ==================== TEST USERS ====================
  console.log('👤 Creating test users...');
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
  
  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin123!', saltRounds);
  const userPassword = await bcrypt.hash('User123!', saltRounds);
  const testPassword = await bcrypt.hash('Test123!', saltRounds);

  // Create users with tenant access
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      primaryTenantId: cloudNativeTenant.id, // Update primary tenant
    },
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      avatar: '/images/avatars/01.png',
      bio: 'System administrator with full access to all tenants and services.',
      urls: ['https://github.com/admin', 'https://linkedin.com/in/admin'],
      dateOfBirth: new Date('1985-01-15'),
      language: 'en',
      primaryTenantId: cloudNativeTenant.id, // Primary tenant for admin
      isActive: true,
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      primaryTenantId: cloudNativeTenant.id, // Update primary tenant
    },
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Cloud Native User',
      avatar: '/images/avatars/02.png',
      bio: 'Regular user with access to Cloud Native doo tenant.',
      urls: ['https://linkedin.com/in/cloudnativeuser'],
      dateOfBirth: new Date('1990-05-20'),
      language: 'en',
      primaryTenantId: cloudNativeTenant.id,
      isActive: true,
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      primaryTenantId: softergeeTenant.id, // Update primary tenant
    },
    create: {
      email: 'test@example.com',
      password: testPassword,
      name: 'Softergee User',
      avatar: '/images/avatars/03.png',
      bio: 'Test user for Softergee doo tenant.',
      urls: [],
      dateOfBirth: new Date('1992-08-10'),
      language: 'en',
      primaryTenantId: softergeeTenant.id,
      isActive: true,
    },
  });

  // Assign tenants to users
  console.log('🔗 Assigning tenants to users...');
  
  // Admin user: access to ALL tenants (super admin) - Cloud Native doo and Softergee doo
  await Promise.all([
    prisma.userTenant.upsert({
      where: {
        userId_tenantId: {
          userId: adminUser.id,
          tenantId: cloudNativeTenant.id,
        },
      },
      update: { isActive: true, role: 'admin' },
      create: {
        userId: adminUser.id,
        tenantId: cloudNativeTenant.id,
        role: 'admin',
        isActive: true,
      },
    }),
    prisma.userTenant.upsert({
      where: {
        userId_tenantId: {
          userId: adminUser.id,
          tenantId: softergeeTenant.id,
        },
      },
      update: { isActive: true, role: 'admin' },
      create: {
        userId: adminUser.id,
        tenantId: softergeeTenant.id,
        role: 'admin',
        isActive: true,
      },
    }),
    // Removed duplicate cloud-native-doo assignment for admin - already assigned above
  ]);

  // Regular user: access to 1 tenant (cloud-native-doo) - Company 1
  await prisma.userTenant.upsert({
    where: {
      userId_tenantId: {
        userId: regularUser.id,
        tenantId: cloudNativeTenant.id,
      },
    },
    update: { isActive: true, role: 'user' },
    create: {
      userId: regularUser.id,
      tenantId: cloudNativeTenant.id,
      role: 'user',
      isActive: true,
    },
  });

  // Test user: access to 1 tenant (softergee-doo) - Company 2
  await prisma.userTenant.upsert({
    where: {
      userId_tenantId: {
        userId: testUser.id,
        tenantId: softergeeTenant.id,
      },
    },
    update: { isActive: true, role: 'user' },
    create: {
      userId: testUser.id,
      tenantId: softergeeTenant.id,
      role: 'user',
      isActive: true,
    },
  });

  // Removed Digital Solutions user - tenant no longer exists

  console.log(`   ✅ Created 1 admin and 2 users`);
  console.log('   📧 Test credentials:');
  console.log('      👑 Admin:');
  console.log('         - admin@example.com / Admin123!');
  console.log('         - Primary tenant: Cloud Native doo');
  console.log('         - Access to ALL companies (Cloud Native doo, Softergee doo)');
  console.log('         - Role: admin for all tenants');
  console.log('      👤 Regular Users:');
  console.log('         - user@example.com / User123!');
  console.log('         - Primary tenant: Cloud Native doo');
  console.log('         - Access to: Cloud Native doo only (role: user)');
  console.log('         - test@example.com / Test123!');
  console.log('         - Primary tenant: Softergee doo');
  console.log('         - Access to: Softergee doo only (role: user)');
  // Use tenant ID from environment or default to Cloud Native doo
  // This allows seeding different tenants via TENANT_ID env var
  const tenantIdString = process.env.TENANT_ID || cloudNativeTenant.id;
  
  // Determine which tenant we're seeding
  const isSoftergee = tenantIdString === softergeeTenant.id;
  const tenantName = isSoftergee ? 'Softergee doo' : 'Cloud Native doo';
  
  console.log(`📦 Seeding data for ${tenantName} (tenant ID: ${tenantIdString.substring(0, 8)}...)`);

  // ==================== ADDRESSES ====================
  console.log(`📍 Creating 50 addresses for ${tenantName}...`);
  
  // Create 50 addresses
  const addressData = [];
  const cities = ['New York', 'London', 'Paris', 'Berlin', 'San Francisco', 'Chicago', 'Manchester', 'Munich', 'Tokyo', 'Sydney', 'Toronto', 'Amsterdam', 'Barcelona', 'Vienna', 'Stockholm', 'Copenhagen', 'Zurich', 'Dublin', 'Brussels', 'Warsaw'];
  const countries = ['United States', 'United Kingdom', 'France', 'Germany', 'Japan', 'Australia', 'Canada', 'Netherlands', 'Spain', 'Austria', 'Sweden', 'Denmark', 'Switzerland', 'Ireland', 'Belgium', 'Poland', 'Italy', 'Portugal', 'Norway', 'Finland'];
  
  for (let i = 0; i < 50; i++) {
    const city = cities[i % cities.length];
    const country = countries[i % countries.length];
    addressData.push({
      street: `${(i + 1) * 10} ${['Main', 'Park', 'Oak', 'Elm', 'First', 'Second', 'Broadway', 'Market', 'High', 'Church'][i % 10]} ${['Street', 'Avenue', 'Road', 'Drive', 'Lane', 'Way', 'Boulevard', 'Circle', 'Place', 'Court'][i % 10]}`,
      city,
      state: country === 'United States' ? ['NY', 'CA', 'IL', 'TX', 'FL', 'MA', 'WA', 'GA', 'NC', 'OH'][i % 10] : null,
      zipCode: `${10000 + i}-${String(i).padStart(3, '0')}`,
      country,
      tenantId: tenantIdString,
    });
  }
  
  const addresses = await Promise.all(
    addressData.map(data => prisma.address.create({ data }))
  );
  
  console.log(`   ✅ Created ${addresses.length} addresses`);

  // ==================== CONTACTS ====================
  console.log(`📞 Creating 50 contacts for ${tenantName}...`);
  
  // Create 50 contacts
  const contactData = [];
  const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Tom', 'Anna', 'Mark', 'Jessica', 'James', 'Maria', 'Robert', 'Jennifer', 'Michael', 'Patricia', 'William', 'Linda'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee'];
  
  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    contactData.push({
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 0 ? i : ''}@example.com`,
      phone: `+1-555-${String(1000 + i).padStart(4, '0')}`,
      website: i % 3 === 0 ? `https://${firstName.toLowerCase()}${lastName.toLowerCase()}.com` : null,
      tenantId: tenantIdString,
    });
  }
  
  const contacts = await Promise.all(
    contactData.map(data => prisma.contact.create({ data }))
  );
  
  console.log(`   ✅ Created ${contacts.length} contacts`);

  // ==================== BANK ACCOUNTS ====================
  console.log(`💰 Creating 50 bank accounts for ${tenantName}...`);
  
  // Create 50 bank accounts
  const bankAccountData = [];
  const bankNames = ['First National Bank', 'Barclays Bank', 'BNP Paribas', 'Deutsche Bank', 'Chase Bank', 'Wells Fargo', 'HSBC', 'Commerzbank', 'Citibank', 'Bank of America', 'Royal Bank', 'Credit Suisse', 'UBS', 'JPMorgan Chase', 'Goldman Sachs', 'Morgan Stanley', 'Santander', 'UniCredit', 'ING Bank', 'Rabobank'];
  const swiftCodes = ['FNBOUS33XXX', 'BARCGB22XXX', 'BNPAFRPPXXX', 'DEUTDEFFXXX', 'CHASUS33XXX', 'WFBIUS6SXXX', 'HSBCGB2LXXX', 'COBADEFFXXX', 'CITIUS33XXX', 'BOFAUS3NXXX', 'ROYCGBC2XXX', 'CRESCHZZXXX', 'UBSWCHZHXXX', 'CHASUS33XXX', 'GOLDUS33XXX', 'MSCHUS33XXX', 'BSCHESMMXXX', 'UNCRITMMXXX', 'INGBNL2AXXX', 'RABONL2UXXX'];
  
  for (let i = 0; i < 50; i++) {
    const bankName = bankNames[i % bankNames.length];
    const swift = swiftCodes[i % swiftCodes.length];
    const isUS = i % 3 === 0;
    const countryCode = ['GB', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'SE'][i % 10];
    // Generate unique IBAN: country code + check digits + bank code + account number + unique suffix
    const uniqueSuffix = String(Date.now() + i).slice(-10); // Use timestamp + index for uniqueness
    const ibanValue = !isUS ? `${countryCode}${String(i + 10).padStart(2, '0')}${String(1000 + i).padStart(4, '0')}${uniqueSuffix.padStart(12, '0')}` : null;
    
    bankAccountData.push({
      bankName: `${bankName}${i > 0 ? ` ${i + 1}` : ''}`,
      accountNumber: `${String(1000000000 + i)}`,
      routingNumber: isUS ? `${String(100000000 + i).padStart(9, '0')}` : null,
      iban: ibanValue,
      swift,
      tenantId: tenantIdString,
    });
  }
  
  const bankAccounts = await Promise.all(
    bankAccountData.map(data => prisma.bankAccount.create({ data }))
  );
  
  console.log(`   ✅ Created ${bankAccounts.length} bank accounts`);

  // ==================== CUSTOMERS (INDIVIDUAL) ====================
  console.log(`🏢 Creating companies first (needed for individual contacts)...`);
  
  // First, create companies (needed for INDIVIDUAL customers to reference)
  const companyData = [];
  const companyTypes = ['CORPORATION', 'LLC', 'LTD', 'GMBH', 'SARL'];
  const industries = ['Technology', 'Manufacturing', 'Consulting', 'Retail', 'Finance', 'Healthcare', 'Education', 'Real Estate', 'Logistics', 'Energy'];
  const companyNames = ['Tech', 'Solutions', 'Global', 'Innovations', 'Systems', 'Services', 'Enterprises', 'Group', 'Partners', 'Industries'];
  
  for (let i = 0; i < 50; i++) {
    const industry = industries[i % industries.length];
    const companyName = companyNames[i % companyNames.length];
    const companyType = companyTypes[i % companyTypes.length];
    const legalName = `${industry} ${companyName} ${i + 1} ${companyType === 'CORPORATION' ? 'Corp.' : companyType === 'LLC' ? 'LLC' : companyType === 'LTD' ? 'Ltd.' : companyType === 'GMBH' ? 'GmbH' : 'SARL'}`;
    const tradingName = `${companyName} ${industry} ${i + 1}`;
    
    companyData.push({
      companyType: companyType as any,
      companyNumber: `COMP-${String(Date.now()).slice(-6)}-${String(i + 1).padStart(8, '0').toUpperCase()}`,
      legalName,
      tradingName,
      taxId: `${String(i + 20).padStart(2, '0')}-${String(9876543 + i).padStart(7, '0')}`,
      registrationNumber: `REG-${String(100000 + i).padStart(6, '0')}`,
      industry,
      addressId: addresses[i % addresses.length].id,
      contactId: contacts[i % contacts.length].id,
      bankAccountId: bankAccounts[i % bankAccounts.length].id,
      status: 'ACTIVE',
      tenantId: tenantIdString,
    });
  }
  
  const companies = await Promise.all(
    companyData.map(data => prisma.company.create({ data }))
  );
  
  console.log(`   ✅ Created ${companies.length} companies`);
  
  // Create individual customers - 2-3 contacts per company
  console.log(`👤 Creating individual customers (2-3 per company) for ${tenantName}...`);
  
  const individualCustomerData = [];
  const customerFirstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Tom', 'Anna', 'Mark', 'Jessica', 'James', 'Maria', 'Robert', 'Jennifer', 'Michael', 'Patricia', 'William', 'Linda', 'Richard', 'Barbara', 'Joseph', 'Elizabeth', 'Thomas', 'Susan', 'Daniel', 'Karen', 'Matthew', 'Nancy', 'Anthony', 'Betty', 'Donald', 'Helen', 'Steven', 'Sandra', 'Paul', 'Donna', 'Andrew', 'Carol', 'Joshua', 'Ruth', 'Kenneth', 'Sharon', 'Kevin', 'Michelle', 'Brian', 'Laura', 'George', 'Sarah', 'Amanda', 'Ryan', 'Nicole', 'Jason', 'Melissa', 'Eric', 'Kimberly', 'Jonathan', 'Stephanie', 'Brandon', 'Rebecca', 'Justin', 'Amy', 'Benjamin', 'Angela', 'Samuel', 'Rachel', 'Nicholas', 'Michelle', 'Nathan', 'Samantha', 'Adam', 'Christina', 'Jordan', 'Heather', 'Zachary', 'Kelly', 'Tyler', 'Ashley', 'Sean', 'Lauren', 'Connor', 'Amber', 'Dylan', 'Stephanie', 'Cameron', 'Brittany', 'Noah', 'Taylor', 'Alex', 'Morgan', 'Hunter', 'Alexis', 'Ethan', 'Julia', 'Aaron', 'Grace'];
  const customerLastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Parker', 'Collins', 'Edwards', 'Stewart', 'Morris', 'Rogers', 'Reed', 'Cook', 'Bailey', 'Ward', 'Torres', 'Peterson', 'Gray', 'Ramirez', 'James', 'Watson', 'Brooks', 'Kelly', 'Sanders', 'Price', 'Bennett', 'Wood', 'Barnes', 'Ross', 'Henderson', 'Coleman', 'Jenkins', 'Perry', 'Powell', 'Long', 'Patterson', 'Hughes', 'Flores', 'Washington', 'Butler', 'Simmons', 'Foster', 'Gonzales', 'Bryant', 'Alexander', 'Russell', 'Griffin', 'Diaz', 'Hayes'];
  const departments = ['Sales', 'Marketing', 'IT', 'HR', 'Finance', 'Operations', 'Customer Support', 'Product', 'Engineering', 'Management'];
  const statuses: ('ACTIVE' | 'PENDING' | 'INACTIVE')[] = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'PENDING', 'INACTIVE'];
  
  let contactIndex = 0;
  
  // For each company, create 2-3 contacts
  for (let companyIndex = 0; companyIndex < companies.length; companyIndex++) {
    const company = companies[companyIndex];
    // Each company gets 2-3 contacts (randomly 2 or 3)
    const contactsPerCompany = Math.floor(Math.random() * 2) + 2; // 2 or 3
    
    for (let j = 0; j < contactsPerCompany; j++) {
      const firstName = customerFirstNames[contactIndex % customerFirstNames.length];
      const lastName = customerLastNames[contactIndex % customerLastNames.length];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${contactIndex > 0 ? contactIndex : ''}@${company.tradingName?.toLowerCase().replace(/\s+/g, '') || 'example'}.com`;
      const department = departments[contactIndex % departments.length];
      
      individualCustomerData.push({
        type: 'INDIVIDUAL',
        customerNumber: `CUST-${String(Date.now()).slice(-6)}-${String(contactIndex + 1).padStart(8, '0').toUpperCase()}`,
        firstName,
        lastName,
        companyName: null,
        companyId: company.id, // OBAVEZNO povezan sa kompanijom
        department: department,
        title: j === 0 ? 'Manager' : j === 1 ? 'Senior' : 'Junior', // Prvi kontakt je manager
        email,
        phone: `+1-555-${String(1000 + contactIndex).padStart(4, '0')}`,
        taxId: `${String(contactIndex + 10).padStart(2, '0')}-${String(3456789 + contactIndex).padStart(7, '0')}`,
        registrationNumber: null,
        addressId: addresses[contactIndex % addresses.length].id,
        contactId: contacts[contactIndex % contacts.length].id,
        bankAccountId: bankAccounts[contactIndex % bankAccounts.length].id,
        status: statuses[contactIndex % statuses.length],
        tenantId: tenantIdString,
      });
      
      contactIndex++;
    }
  }
  
  const individualCustomers = await Promise.all(
    individualCustomerData.map(data => prisma.customer.create({ data }))
  );
  
  console.log(`   ✅ Created ${individualCustomers.length} individual customers (all linked to companies)`);
  
  // Verify distribution
  const contactsPerCompany = await Promise.all(
    companies.map(async (company) => {
      const count = await prisma.customer.count({
        where: { companyId: company.id, type: 'INDIVIDUAL' }
      });
      return { companyName: company.legalName, contactCount: count };
    })
  );
  
  console.log(`   📊 Contacts per company distribution:`);
  contactsPerCompany.slice(0, 5).forEach(c => {
    console.log(`      - ${c.companyName}: ${c.contactCount} contacts`);
  });

  // ==================== CUSTOMERS (COMPANY) ====================
  console.log(`🏢 Creating 50 company customers for ${tenantName}...`);
  
  const companyCustomerData = [];
  const customerCompanyTypes = ['LLC', 'Inc.', 'Corp.', 'Ltd.', 'GmbH', 'SARL', 'BV', 'PT', 'AB', 'Oy'];
  const customerIndustries = ['Technology', 'Manufacturing', 'Consulting', 'Retail', 'Finance', 'Healthcare', 'Education', 'Real Estate', 'Logistics', 'Energy'];
  const customerCompanyNames = ['Tech', 'Solutions', 'Global', 'Innovations', 'Systems', 'Services', 'Enterprises', 'Group', 'Partners', 'Industries'];
  
  for (let i = 0; i < 50; i++) {
    const industry = customerIndustries[i % customerIndustries.length];
    const companyType = customerCompanyTypes[i % customerCompanyTypes.length];
    const companyName = `${industry} ${customerCompanyNames[i % customerCompanyNames.length]} ${companyType}`;
    // Generate unique email by including index
    const email = `contact${i}@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}${i}.com`;
    const statuses: ('ACTIVE' | 'PENDING' | 'INACTIVE')[] = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'PENDING', 'INACTIVE'];
    
    companyCustomerData.push({
      type: 'COMPANY',
      customerNumber: `CUST-COMP-${String(Date.now()).slice(-6)}-${String(i + 1).padStart(8, '0').toUpperCase()}`,
      firstName: null,
      lastName: null,
      companyName,
      email,
      phone: `+1-555-${String(2000 + i).padStart(4, '0')}`,
      taxId: `${String(i + 50).padStart(2, '0')}-${String(7654321 + i).padStart(7, '0')}`,
      registrationNumber: `${companyType.replace('.', '').toUpperCase()}-2024-${String(i + 1).padStart(3, '0')}`,
      addressId: addresses[i % addresses.length].id,
      contactId: contacts[i % contacts.length].id,
      bankAccountId: bankAccounts[i % bankAccounts.length].id,
      status: statuses[i % statuses.length],
      tenantId: tenantIdString,
    });
  }
  
  const companyCustomers = await Promise.all(
    companyCustomerData.map(data => prisma.customer.create({ data }))
  );

  // ==================== COMPANIES ====================
  // Note: Companies are already created above (before INDIVIDUAL customers)
  // No need to create them again here - use the companies created earlier

  // All contacts already created (50 total)
  const allContacts = contacts;
  console.log(`   📞 Created ${allContacts.length} total contacts`);

  // All companies already created (50 total) - from earlier creation
  const allCompanies = companies;
  console.log(`   🏛️ Created ${allCompanies.length} total companies`);

  console.log('✅ Registry Service seed completed successfully');
  console.log(`   🏢 Created ${tenants.length} tenants (for multi-tenancy)`);
  console.log(`   📍 Created ${addresses.length} addresses`);
  console.log(`   📞 Created ${allContacts.length} contacts`);
  console.log(`   💰 Created ${bankAccounts.length} bank accounts`);
  console.log(`   👤 Created ${individualCustomers.length} individual customers`);
  console.log(`   🏢 Created ${companyCustomers.length} company customers`);
  console.log(`   🏛️ Created ${allCompanies.length} companies (these are clients/customers, NOT tenant companies)`);
  
  // Store IDs for other services
  const seedResults = {
    customerIds: [...individualCustomers.map(c => c.id), ...companyCustomers.map(c => c.id)],
    companyIds: allCompanies.map(c => c.id),
    contactIds: allContacts.map(c => c.id),
    tenantId: tenantIdString,
    tenantIds: tenants.map(t => ({ id: t.id, name: t.name, displayName: t.displayName })),
    userIds: {
      admin: adminUser.id,
      regular: regularUser.id,
      test: testUser.id,
    },
  };
  
  console.log('\n📋 Seed Results for integration:');
  console.log(JSON.stringify(seedResults, null, 2));
  
  console.log('\n✅ Seeding completed successfully!');
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
