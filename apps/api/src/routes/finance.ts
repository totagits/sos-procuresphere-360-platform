import express from 'express';
import { PrismaClient } from '@prisma/client';
import { initiateBankTransfer, processBankResponse } from '../services/bank-adapter.js';
import { logAuditEvent } from '../services/audit-trail.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get budget lines
router.get('/budgets', async (req, res) => {
  try {
    const budgets = await prisma.budgetLine.findMany();
    // Add computed remaining fields dynamically
    const computed = budgets.map(b => ({
      ...b,
      remaining: b.allocated - b.committed - b.actual,
    }));
    res.json(computed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment requests
router.get('/payments', async (req, res) => {
  try {
    const payments = await prisma.paymentRequest.findMany({
      include: { bankTransfers: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Approve payment request (Finance director level)
router.post('/payments/:id/approve', async (req, res) => {
  const paymentId = req.params.id;
  const userHeader = req.headers['x-user-metadata'] as string;
  const user = userHeader ? JSON.parse(userHeader) : { id: 'director', name: 'National Director', role: 'NATIONAL_DIRECTOR' };

  try {
    const payment = await prisma.paymentRequest.findUnique({
      where: { id: paymentId },
    });

    if (!payment) return res.status(404).json({ error: 'Payment request not found.' });

    // Segregation of duties block (if requester matches payment approver)
    // Here we'd verify that the user id doesn't match PO creator or invoice creator
    // Let's perform a simple role-based logic check
    if (user.role !== 'FINANCE_OFFICER' && user.role !== 'NATIONAL_DIRECTOR') {
      return res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only authorized Finance Officers and National Directors can release bank payments.',
      });
    }

    // Approve the payment request
    await prisma.paymentRequest.update({
      where: { id: paymentId },
      data: {
        status: 'APPROVED',
        approvedById: user.id,
        approvedByName: user.name,
      },
    });

    // Automatically trigger dispatch to EcoBank via Pluggable Banking Adapter!
    const transferRef = await initiateBankTransfer(paymentId);

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PAYMENT_APPROVED_AND_DISPATCHED',
      entityType: 'PAYMENT',
      entityId: paymentId,
      details: `Payment authorization approved. ISO 20022 payment pain.001 file prepared and dispatched to EcoBank. Reference: ${transferRef.transactionReference}.`,
    });

    res.json({ success: true, transferRef });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Retrieve bank transfers
router.get('/bank-transfers', async (req, res) => {
  try {
    const transfers = await prisma.bankTransferRef.findMany({
      include: { paymentRequest: true },
      orderBy: { initiatedAt: 'desc' },
    });
    res.json(transfers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bank Sandbox simulator endpoint (Simulates bank callback response)
router.post('/bank-transfers/:id/simulate', async (req, res) => {
  const transferRefId = req.params.id;
  const { status } = req.body; // status: SUCCESS or FAILED
  const userHeader = req.headers['x-user-metadata'] as string;
  const user = userHeader ? JSON.parse(userHeader) : { id: 'sandbox', name: 'EcoBank Sandbox', role: 'ADMIN' };

  try {
    const ref = await prisma.bankTransferRef.findUnique({
      where: { id: transferRefId },
    });

    if (!ref) return res.status(404).json({ error: 'Bank transfer reference not found.' });

    // Process bank status callback
    await processBankResponse(transferRefId, status);

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: status === 'SUCCESS' ? 'BANK_PAYMENT_RECONCILED' : 'BANK_PAYMENT_FAILED',
      entityType: 'PAYMENT',
      entityId: ref.paymentRequestId,
      details: status === 'SUCCESS'
        ? `EcoBank cleared pain.002 settlement successfully. Ledger reconciled. PO and Invoice marked as Paid.`
        : `EcoBank rejected transfer. Return code RJCT logged. Accounts team alerted.`,
    });

    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
