import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SOS ProcureSphere 360 database...');

  // 1. Clear existing database
  await prisma.auditLog.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.bankTransferRef.deleteMany();
  await prisma.paymentRequest.deleteMany();
  await prisma.workflowException.deleteMany();
  await prisma.threeWayMatchResult.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.gRNLineItem.deleteMany();
  await prisma.goodsReceiptNote.deleteMany();
  await prisma.pOAmendment.deleteMany();
  await prisma.pOLineItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.bidEvaluation.deleteMany();
  await prisma.rFxAward.deleteMany();
  await prisma.bidItem.deleteMany();
  await prisma.supplierBid.deleteMany();
  await prisma.rFxItem.deleteMany();
  await prisma.rFx.deleteMany();
  await prisma.pRApproval.deleteMany();
  await prisma.pRLineItem.deleteMany();
  await prisma.purchaseRequisition.deleteMany();
  await prisma.budgetLine.deleteMany();
  await prisma.supplierPerformance.deleteMany();
  await prisma.supplierDocument.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.department.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database cleaned. Generating core metadata...');

  // 2. Locations Seeding
  const monrovia = await prisma.location.create({
    data: { name: 'Monrovia Children Village', code: 'MVR' },
  });
  const kakata = await prisma.location.create({
    data: { name: 'Kakata Vocational Center', code: 'KKT' },
  });
  const juahTown = await prisma.location.create({
    data: { name: 'Juah Town School', code: 'JT' },
  });

  // 3. Departments Seeding
  const education = await prisma.department.create({
    data: { name: 'Education & Schools', code: 'EDU' },
  });
  const health = await prisma.department.create({
    data: { name: 'Health & Medical Services', code: 'HLT' },
  });
  const operations = await prisma.department.create({
    data: { name: 'Village Operations & Fuel', code: 'OPR' },
  });
  const programs = await prisma.department.create({
    data: { name: 'Youth Development Programs', code: 'PRG' },
  });

  // 4. Budget Lines Seeding
  const budget1 = await prisma.budgetLine.create({
    data: {
      code: 'KKT-EDU-2026-01',
      project: 'Kakata School Supplies Expansion',
      grant: 'SOS-LIB-EDU-26',
      donor: 'SOS International (Austria)',
      allocated: 12000.0,
      committed: 0.0,
      actual: 0.0,
    },
  });

  const budget2 = await prisma.budgetLine.create({
    data: {
      code: 'MVR-HLT-2026-02',
      project: 'Monrovia Clinic Restoration',
      grant: 'USAID-HEALTH-LIB-25',
      donor: 'USAID (United States)',
      allocated: 35000.0,
      committed: 0.0,
      actual: 0.0,
    },
  });

  const budget3 = await prisma.budgetLine.create({
    data: {
      code: 'KKT-PRG-2026-03',
      project: 'Vocational Carpentry Tools',
      grant: 'EU-YOUTH-WORK-26',
      donor: 'European Union Commission',
      allocated: 6500.0,
      committed: 0.0,
      actual: 0.0,
    },
  });

  const budget4 = await prisma.budgetLine.create({
    data: {
      code: 'MVR-OPR-2026-04',
      project: 'Monrovia Diesel Generator Fuel',
      grant: 'SOS-WORLD-OP-26',
      donor: 'SOS Children Villages Germany',
      allocated: 9500.0,
      committed: 0.0,
      actual: 0.0,
    },
  });

  console.log('Seeding pre-configured user credentials...');

  // 5. Users Seeding (Password Plain for MVP Local Auth Validation)
  // In real applications, passwords would be hashed. We use a simple plain check for local testing efficiency.
  await prisma.user.createMany({
    data: [
      {
        name: 'Mona Taylor',
        email: 'admin@sosliberia.org',
        passwordHash: 'admin123',
        role: 'ADMIN',
        active: true,
      },
      {
        name: 'John Flomo',
        email: 'procurement@sosliberia.org',
        passwordHash: 'procurement123',
        role: 'PROCUREMENT_OFFICER',
        departmentId: operations.id,
        locationId: monrovia.id,
        active: true,
      },
      {
        name: 'Patricia Koffa',
        email: 'finance@sosliberia.org',
        passwordHash: 'finance123',
        role: 'FINANCE_OFFICER',
        departmentId: operations.id,
        locationId: monrovia.id,
        active: true,
      },
      {
        name: 'George Weah Jr.',
        email: 'head@sosliberia.org',
        passwordHash: 'head123',
        role: 'DEPARTMENT_HEAD',
        departmentId: education.id,
        locationId: kakata.id,
        active: true,
      },
      {
        name: 'Dr. Evelyn Cooper',
        email: 'director@sosliberia.org',
        passwordHash: 'director123',
        role: 'NATIONAL_DIRECTOR',
        departmentId: operations.id,
        locationId: monrovia.id,
        active: true,
      },
      {
        name: 'Sarah Coleman (EU Audit Lead)',
        email: 'auditor@sosliberia.org',
        passwordHash: 'auditor123',
        role: 'AUDITOR',
        active: true,
      },
    ],
  });

  console.log('Seeding mock Supplier Database & Compliance states...');

  // 6. Suppliers Seeding
  const s1 = await prisma.supplier.create({
    data: {
      name: 'Office Plus Liberia',
      email: 'sales@officeplus.com',
      phone: '+231-776-554-321',
      address: 'Broad Street, Monrovia, Liberia',
      taxId: 'TAX-7749-OPL',
      bankName: 'EcoBank Liberia',
      bankAccount: 'LR-002-38493-ECO',
      categories: 'Office Supplies,Stationery,School Kits',
      rating: 94.5,
      status: 'APPROVED',
      preferred: true,
      dueDiligenceCompleted: true,
    },
  });

  const s2 = await prisma.supplier.create({
    data: {
      name: 'Liberia Builders Group',
      email: 'bids@liberiabuilders.com',
      phone: '+231-886-909-123',
      address: 'Tubman Boulevard, Sinkor, Monrovia',
      taxId: 'TAX-1188-LBG',
      bankName: 'United Bank for Africa (UBA)',
      bankAccount: 'LR-040-99382-UBA',
      categories: 'Construction,Repairs,Furniture',
      rating: 91.0,
      status: 'APPROVED',
      preferred: true,
      dueDiligenceCompleted: true,
    },
  });

  const s3 = await prisma.supplier.create({
    data: {
      name: 'CyberTech Solutions',
      email: 'support@cybertechlib.com',
      phone: '+231-770-443-882',
      address: 'Randall Street, Monrovia',
      taxId: 'TAX-9043-CYB',
      bankName: 'International Bank Liberia',
      bankAccount: 'LR-003-90342-IBL',
      categories: 'IT Hardware,CCTV,Networking,Electronics',
      rating: 78.0,
      status: 'PENDING',
      preferred: false,
      dueDiligenceCompleted: false,
    },
  });

  const s4 = await prisma.supplier.create({
    data: {
      name: 'Substandard Vendors Inc',
      email: 'delayed@substandard.com',
      phone: '+231-886-554-990',
      address: 'Duala Market Road, Bushrod Island',
      taxId: 'TAX-0033-SUB',
      bankName: 'Liberian Bank for Development & Investment (LBDI)',
      bankAccount: 'LR-005-22442-LBD',
      categories: 'Janitorial Supplies,Office Supplies',
      rating: 45.0,
      status: 'SUSPENDED',
      isBlacklisted: true,
      blacklistReason: 'Severe delivery delays (>30 days) and supply of unapproved off-brand materials.',
      blacklistDate: new Date('2026-02-15'),
      preferred: false,
      dueDiligenceCompleted: true,
    },
  });

  // 7. Supplier Documents Seeding
  await prisma.supplierDocument.createMany({
    data: [
      {
        supplierId: s1.id,
        docType: 'BUSINESS_REGISTRATION',
        url: '/uploads/suppliers/office_plus_registration.pdf',
        expiryDate: new Date('2027-12-31'),
        status: 'VALID',
      },
      {
        supplierId: s1.id,
        docType: 'TAX_CLEARANCE',
        url: '/uploads/suppliers/office_plus_tax.pdf',
        expiryDate: new Date('2026-10-30'),
        status: 'VALID',
      },
      {
        supplierId: s2.id,
        docType: 'BUSINESS_REGISTRATION',
        url: '/uploads/suppliers/builders_registration.pdf',
        expiryDate: new Date('2027-06-15'),
        status: 'VALID',
      },
      {
        supplierId: s3.id,
        docType: 'BUSINESS_REGISTRATION',
        url: '/uploads/suppliers/cybertech_registration.pdf',
        expiryDate: new Date('2025-05-01'),
        status: 'EXPIRED', // Expired due diligence triggers warnings
      },
    ],
  });

  // 8. Supplier Performance Seeding
  await prisma.supplierPerformance.createMany({
    data: [
      {
        supplierId: s1.id,
        deliveryScore: 98.0,
        qualityScore: 95.0,
        complianceScore: 90.0,
        feedback: 'Excellent response time. Quality of notebooks and writing materials consistently high.',
        evaluatorId: 'procurement-officer-id',
      },
      {
        supplierId: s2.id,
        deliveryScore: 88.0,
        qualityScore: 92.0,
        complianceScore: 93.0,
        feedback: 'Sturdy school furniture. Handled Monrovia clinic structural additions very professionally.',
        evaluatorId: 'procurement-officer-id',
      },
    ],
  });

  // 9. DMS Standard Document Categorization Seed
  await prisma.document.create({
    data: {
      title: 'SOS Liberia Country Procurement Guidelines 2026',
      fileName: 'SOS_Liberia_Procurement_Policy_2026.pdf',
      fileSize: 1048576, // 1MB
      docType: 'SUPPLIER_COMPLIANCE',
      url: '/uploads/dms/SOS_Liberia_Procurement_Policy_2026.pdf',
      version: 1,
      uploadedById: 'admin-id',
      uploadedByName: 'Mona Taylor',
      retentionCategory: 'General Policy (Permanently)',
      isArchived: false,
      metadataJson: JSON.stringify({
        ocrIndexed: true,
        ocrText: 'This document defines the official donor-mandated procurement policies of SOS Children’s Villages Liberia. All items exceeding $500 require three competitive quotes. Transactions over $5,000 demand a national tender process and National Director sign-off. Segregation of duties must be enforced at all times.',
      }),
    },
  });

  // 10. Audit Log Seeding for baseline audit history
  await prisma.auditLog.create({
    data: {
      userId: 'system',
      userName: 'SOS ProcureSphere Engine',
      userRole: 'ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'USER',
      entityId: 'system',
      details: 'System database initialized and populated with standard Liberia locations, donor grants, budget lines, and admin credentials.',
      ipAddress: '127.0.0.1',
      integrityHash: '9a8d7c6b5e4d3c2b1a0f9e8d7c6b5e4d3c2b1a0f',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
