import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth.js';
import suppliersRouter from './routes/suppliers.js';
import procurementRouter from './routes/procurement.js';
import financeRouter from './routes/finance.js';
import dmsRouter from './routes/dms.js';
import auditRouter from './routes/audit.js';

const app = express();
const prisma = new PrismaClient();

// Config midleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock storage folder for DMS
import fs from 'fs';
import path from 'path';
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Mounted API routes (v1)
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/suppliers', suppliersRouter);
app.use('/api/v1/procurement', procurementRouter);
app.use('/api/v1/finance', financeRouter);
app.use('/api/v1/dms', dmsRouter);
app.use('/api/v1/audit', auditRouter);

// Interactive OpenAPI JSON Specs
app.get('/api/docs', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'SOS ProcureSphere 360 - Open API Platform',
      version: '1.0.0',
      description: 'Unified End-to-End P2P, DMS, and Pluggable Bank integration endpoints for SOS Children’s Villages Liberia.',
    },
    paths: {
      '/api/v1/auth/login': { post: { summary: 'Employee Authentication and session JWT generation' } },
      '/api/v1/suppliers': {
        get: { summary: 'Retrieve full onboarded supplier database' },
        post: { summary: 'Supplier onboarding request' },
      },
      '/api/v1/procurement/pr': {
        get: { summary: 'Retrieve all purchase requisitions' },
        post: { summary: 'Create purchase requisition with real-time budget availability checks' },
      },
      '/api/v1/procurement/rfx': {
        get: { summary: 'Retrieve RFI/RFQ/RFPs' },
        post: { summary: 'Publish sourcing tender' },
      },
      '/api/v1/procurement/po': {
        get: { summary: 'Retrieve Purchase Orders' },
      },
      '/api/v1/finance/budgets': {
        get: { summary: 'Fetch allocations, commitments, and actual expenditures per donor grant' },
      },
      '/api/v1/dms/search': {
        get: { summary: 'Full-text query of digitized documents across OCR indexes' },
      },
      '/api/v1/dms/audit-pack': {
        get: { summary: 'One-click Donor Audit Pack generator' },
      },
      '/api/v1/audit/logs': {
        get: { summary: 'View immutable system activity ledger' },
      },
    },
  });
});

// Port configuration
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  SOS ProcureSphere 360 REST Server running on port ${PORT}`);
  console.log(`  OpenAPI Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`======================================================\n`);
});

// Graceful cleanup
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
