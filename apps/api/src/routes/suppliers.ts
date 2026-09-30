import express from 'express';
import { PrismaClient } from '@prisma/client';
import { logAuditEvent } from '../services/audit-trail.js';

const router = express.Router();
const prisma = new PrismaClient();

// List all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        documents: true,
        performances: true,
      },
    });
    res.json(suppliers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Onboard Supplier
router.post('/', async (req, res) => {
  const { name, email, phone, address, taxId, bankName, bankAccount, categories } = req.body;
  const userHeader = req.headers['x-user-metadata'] as string;
  const user = userHeader ? JSON.parse(userHeader) : { id: 'anonymous', name: 'Anonymous', role: 'SUPPLIER' };

  try {
    const supplier = await prisma.supplier.create({
      data: {
        name,
        email,
        phone,
        address,
        taxId,
        bankName,
        bankAccount,
        categories: Array.isArray(categories) ? categories.join(',') : categories,
        status: 'PENDING',
        rating: 100.0,
      },
    });

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'SUPPLIER_ONBOARD_INITIATED',
      entityType: 'SUPPLIER',
      entityId: supplier.id,
      details: `New supplier profile onboarding requested: ${name}. Set status to PENDING awaiting due diligence approval.`,
    });

    res.status(201).json(supplier);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update compliance evaluation / rating
router.post('/:id/evaluate', async (req, res) => {
  const { deliveryScore, qualityScore, complianceScore, feedback } = req.body;
  const supplierId = req.params.id;
  const userHeader = req.headers['x-user-metadata'] as string;
  const user = userHeader ? JSON.parse(userHeader) : { id: 'evaluator', name: 'Evaluator', role: 'PROCUREMENT_OFFICER' };

  try {
    const perf = await prisma.supplierPerformance.create({
      data: {
        supplierId,
        deliveryScore: parseFloat(deliveryScore),
        qualityScore: parseFloat(qualityScore),
        complianceScore: parseFloat(complianceScore),
        feedback,
        evaluatorId: user.id,
      },
    });

    // Update aggregate supplier rating
    const averageRating = (parseFloat(deliveryScore) + parseFloat(qualityScore) + parseFloat(complianceScore)) / 3;
    
    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        rating: averageRating,
        dueDiligenceCompleted: averageRating >= 70,
        status: averageRating >= 70 ? 'APPROVED' : 'SUSPENDED',
      },
    });

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'SUPPLIER_PERFORMANCE_EVALUATED',
      entityType: 'SUPPLIER',
      entityId: supplierId,
      details: `Supplier rated: Delivery (${deliveryScore}%), Quality (${qualityScore}%), Compliance (${complianceScore}%). New average: ${averageRating.toFixed(2)}%. Status: ${supplier.status}.`,
    });

    res.json({ supplier, performance: perf });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Blacklist/Suspend Supplier
router.post('/:id/blacklist', async (req, res) => {
  const { reason } = req.body;
  const supplierId = req.params.id;
  const userHeader = req.headers['x-user-metadata'] as string;
  const user = userHeader ? JSON.parse(userHeader) : { id: 'admin', name: 'Admin', role: 'ADMIN' };

  try {
    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        isBlacklisted: true,
        blacklistReason: reason,
        blacklistDate: new Date(),
        status: 'SUSPENDED',
      },
    });

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'SUPPLIER_BLACKLISTED',
      entityType: 'SUPPLIER',
      entityId: supplierId,
      details: `Supplier blacklisted and suspended by ${user.name}. Reason: "${reason}".`,
    });

    res.json(supplier);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
