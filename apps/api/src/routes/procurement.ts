import express from 'express';
import { PrismaClient } from '@prisma/client';
import { checkBudget, commitFunds, releaseCommittedFunds } from '../services/budget.js';
import { logAuditEvent } from '../services/audit-trail.js';

const router = express.Router();
const prisma = new PrismaClient();

// ==========================================
// 1. Purchase Requisitions (PR)
// ==========================================

router.get('/pr', async (req, res) => {
  try {
    const prs = await prisma.purchaseRequisition.findMany({
      include: { lineItems: true, approvals: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(prs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/pr', async (req, res) => {
  const { title, locationId, departmentId, budgetLineId, justification, items } = req.body;
  const userHeader = req.headers['x-user-metadata'] as string;
  const user = userHeader ? JSON.parse(userHeader) : { id: 'requester', name: 'Requester', role: 'DEPARTMENT_HEAD' };

  try {
    // Calculate total amount
    const totalAmount = items.reduce((sum: number, it: any) => sum + (it.quantity * it.estimatedPrice), 0.0);

    // Enforce real-time budget availability checks
    const budgetCheck = await checkBudget(budgetLineId, totalAmount);
    
    if (!budgetCheck.passed && budgetCheck.mode === 'HARD_CHECK') {
      return res.status(400).json({
        error: 'BUDGET_OVERRUN_BLOCKED',
        message: budgetCheck.message,
      });
    }

    const prCode = `PR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const pr = await prisma.purchaseRequisition.create({
      data: {
        code: prCode,
        title,
        status: 'PENDING_APPROVAL',
        locationId,
        departmentId,
        budgetLineId,
        requesterId: user.id,
        justification,
        estimatedTotal: totalAmount,
        assignedApproverId: null, // assigned dynamically in production
      },
    });

    // Write line items
    for (const item of items) {
      await prisma.pRLineItem.create({
        data: {
          prId: pr.id,
          description: item.description,
          quantity: parseFloat(item.quantity),
          estimatedPrice: parseFloat(item.estimatedPrice),
          unit: item.unit || 'pcs',
          budgetCode: budgetCheck.budgetLineCode,
        },
      });
    }

    // Auto-commit budget on PR initiation (representing NGOs commitment reserve policy)
    await commitFunds(budgetLineId, totalAmount);

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PR_CREATED',
      entityType: 'PR',
      entityId: pr.id,
      details: `Requisition ${prCode} created for $${totalAmount.toFixed(2)}. ${budgetCheck.message}`,
    });

    res.status(201).json({ pr, budgetCheck });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/pr/:id/approve', async (req, res) => {
  const { decision, comments } = req.body;
  const prId = req.params.id;
  const userHeader = req.headers['x-user-metadata'] as string;
  const user = userHeader ? JSON.parse(userHeader) : { id: 'approver', name: 'Approver', role: 'DEPARTMENT_HEAD' };

  try {
    const pr = await prisma.purchaseRequisition.findUnique({
      where: { id: prId },
    });

    if (!pr) {
      return res.status(404).json({ error: 'Purchase requisition not found.' });
    }

    // Segregation of duties protection (requester cannot approve)
    if (pr.requesterId === user.id) {
      return res.status(403).json({
        error: 'SEGREGATION_OF_DUTIES_VIOLATION',
        message: 'Compliance Error: You cannot approve a transaction that you initiated.',
      });
    }

    const nextLevel = pr.currentApprovalLevel + 1;
    let finalStatus = 'PENDING_APPROVAL';

    if (decision === 'REJECTED') {
      finalStatus = 'REJECTED';
      // Release committed funds
      await releaseCommittedFunds(pr.budgetLineId, pr.estimatedTotal);
    } else {
      // Determine if final threshold is reached
      // Under $500: 1 level (Dept Head).
      // $500 - $5,000: 2 levels (Dept Head -> Finance Officer).
      // > $5,000: 3 levels (Dept Head -> Finance -> National Director).
      const total = pr.estimatedTotal;
      if (total <= 500.0 && nextLevel >= 1) finalStatus = 'APPROVED';
      else if (total > 500.0 && total <= 5000.0 && nextLevel >= 2) finalStatus = 'APPROVED';
      else if (total > 5000.0 && nextLevel >= 3) finalStatus = 'APPROVED';
    }

    const updatedPr = await prisma.purchaseRequisition.update({
      where: { id: prId },
      data: {
        status: finalStatus,
        currentApprovalLevel: decision === 'APPROVED' ? nextLevel : pr.currentApprovalLevel,
      },
    });

    await prisma.pRApproval.create({
      data: {
        prId,
        approverId: user.id,
        approverName: user.name,
        role: user.role,
        decision,
        comments,
        level: nextLevel,
      },
    });

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: decision === 'APPROVED' ? 'PR_APPROVED' : 'PR_REJECTED',
      entityType: 'PR',
      entityId: prId,
      details: `Requisition approved at level ${nextLevel}. Status changed to ${finalStatus}. Auditor notes: "${comments || 'N/A'}"`,
    });

    // Auto-Generate PO if PR is fully approved
    let po = null;
    if (finalStatus === 'APPROVED') {
      po = await generatePOFromPR(pr.id, user);
    }

    res.json({ pr: updatedPr, po });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to auto-generate PO
async function generatePOFromPR(prId: string, authorUser: any) {
  const pr = await prisma.purchaseRequisition.findUnique({
    where: { id: prId },
    include: { lineItems: true },
  });

  if (!pr) return null;

  // Find preferred supplier based on categories or default to builders group
  const defaultSupplier = await prisma.supplier.findFirst({
    where: { status: 'APPROVED', preferred: true },
  });

  const supplierId = defaultSupplier?.id || 'office-supplies-id';
  const supplierName = defaultSupplier?.name || 'Office Plus Liberia';

  const poCode = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const po = await prisma.purchaseOrder.create({
    data: {
      prId: pr.id,
      supplierId,
      supplierName,
      code: poCode,
      status: 'APPROVED',
      totalAmount: pr.estimatedTotal,
      deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days lead time
      paymentTerms: 'NET_30',
      createdById: pr.requesterId,
      approvedById: authorUser.id,
    },
  });

  for (const item of pr.lineItems) {
    await prisma.pOLineItem.create({
      data: {
        poId: po.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.estimatedPrice,
        totalPrice: item.quantity * item.estimatedPrice,
        receivedQuantity: 0.0,
      },
    });
  }

  await logAuditEvent({
    userId: 'system',
    userName: 'SOS ProcureSphere Engine',
    userRole: 'ADMIN',
    action: 'PO_AUTO_GENERATED',
    entityType: 'PO',
    entityId: po.id,
    details: `Purchase Order ${poCode} auto-generated for preferred supplier "${supplierName}" upon full approval of PR ${pr.code}.`,
  });

  return po;
}

// ==========================================
// 2. E-Sourcing (RFx / Tenders)
// ==========================================

router.get('/rfx', async (req, res) => {
  try {
    const rfxs = await prisma.rFx.findMany({
      include: { items: true, bids: true, evaluations: true, awards: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rfxs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/rfx', async (req, res) => {
  const { prId, title, description, closingDate, categories } = req.body;
  const userHeader = req.headers['x-user-metadata'] as string;
  const user = userHeader ? JSON.parse(userHeader) : { id: 'procurement', name: 'Buyer', role: 'PROCUREMENT_OFFICER' };

  try {
    const pr = await prisma.purchaseRequisition.findUnique({
      where: { id: prId },
      include: { lineItems: true },
    });

    if (!pr) {
      return res.status(404).json({ error: 'Purchase requisition not found.' });
    }

    const rfxCode = `RFQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const rfx = await prisma.rFx.create({
      data: {
        prId,
        code: rfxCode,
        type: 'RFQ',
        title,
        description,
        closingDate: new Date(closingDate),
        categories: Array.isArray(categories) ? categories.join(',') : categories,
        status: 'OPEN',
      },
    });

    for (const item of pr.lineItems) {
      await prisma.rFxItem.create({
        data: {
          rfxId: rfx.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
        },
      });
    }

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'RFQ_PUBLISHED',
      entityType: 'RFQ',
      entityId: rfx.id,
      details: `Requisition ${pr.code} escalated to public competitive tender. RFQ ${rfxCode} launched.`,
    });

    res.status(201).json(rfx);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/rfx/:id/bid', async (req, res) => {
  const rfxId = req.params.id;
  const { supplierId, totalPrice, leadTimeDays, warrantyPeriod, notes, items } = req.body;

  try {
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) return res.status(404).json({ error: 'Supplier profile not found.' });

    const bid = await prisma.supplierBid.create({
      data: {
        rfxId,
        supplierId,
        supplierName: supplier.name,
        totalPrice: parseFloat(totalPrice),
        leadTimeDays: parseInt(leadTimeDays),
        warrantyPeriod,
        notes,
        status: 'SUBMITTED',
        confidentialTimeLock: true,
      },
    });

    for (const it of items) {
      await prisma.bidItem.create({
        data: {
          bidId: bid.id,
          description: it.description,
          quantity: parseFloat(it.quantity),
          unitPrice: parseFloat(it.unitPrice),
          totalPrice: parseFloat(it.quantity) * parseFloat(it.unitPrice),
        },
      });
    }

    await logAuditEvent({
      userId: supplierId,
      userName: supplier.name,
      userRole: 'SUPPLIER',
      action: 'BID_SUBMITTED',
      entityType: 'RFQ',
      entityId: rfxId,
      details: `Supplier submitted time-locked bid. Total bid price: $${parseFloat(totalPrice).toFixed(2)}.`,
    });

    res.status(201).json(bid);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/rfx/:id/award', async (req, res) => {
  const rfxId = req.params.id;
  const { bidId, justification } = req.body;
  const userHeader = req.headers['x-user-metadata'] as string;
  const user = userHeader ? JSON.parse(userHeader) : { id: 'buyer', name: 'Buyer', role: 'PROCUREMENT_OFFICER' };

  try {
    const bid = await prisma.supplierBid.findUnique({ where: { id: bidId } });
    const rfx = await prisma.rFx.findUnique({ where: { id: rfxId } });

    if (!bid || !rfx) {
      return res.status(404).json({ error: 'Sourcing entity or supplier bid not found.' });
    }

    // Award the tender
    const award = await prisma.rFxAward.create({
      data: {
        rfxId,
        bidId,
        supplierId: bid.supplierId,
        awardedBy: user.name,
        justification,
        contractAmount: bid.totalPrice,
      },
    });

    await prisma.rFx.update({
      where: { id: rfxId },
      data: { status: 'AWARDED' },
    });

    await prisma.supplierBid.update({
      where: { id: bidId },
      data: { status: 'AWARDED' },
    });

    // Decline other bids
    await prisma.supplierBid.updateMany({
      where: { rfxId, NOT: { id: bidId } },
      data: { status: 'DECLINED' },
    });

    // Generate Purchase Order based on this bid
    const poCode = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const po = await prisma.purchaseOrder.create({
      data: {
        prId: rfx.prId,
        rfxId,
        supplierId: bid.supplierId,
        supplierName: bid.supplierName,
        code: poCode,
        status: 'APPROVED',
        totalAmount: bid.totalPrice,
        deliveryDate: new Date(Date.now() + bid.leadTimeDays * 24 * 60 * 60 * 1000),
        paymentTerms: 'NET_30',
        createdById: user.id,
      },
    });

    const bidItems = await prisma.bidItem.findMany({ where: { bidId } });
    for (const item of bidItems) {
      await prisma.pOLineItem.create({
        data: {
          poId: po.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          receivedQuantity: 0.0,
        },
      });
    }

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'TENDER_AWARDED',
      entityType: 'RFQ',
      entityId: rfxId,
      details: `RFQ ${rfx.code} awarded to ${bid.supplierName}. Contract value: $${bid.totalPrice.toFixed(2)}. Purchase order ${poCode} released.`,
    });

    res.json({ award, po });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. Purchase Orders (PO)
// ==========================================

router.get('/po', async (req, res) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: { lineItems: true, amendments: true, grns: true, invoices: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(pos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/po/:id/amend', async (req, res) => {
  const poId = req.params.id;
  const { justification, changes } = req.body; // changes is array of items to update
  const userHeader = req.headers['x-user-metadata'] as string;
  const user = userHeader ? JSON.parse(userHeader) : { id: 'procurement', name: 'Buyer', role: 'PROCUREMENT_OFFICER' };

  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { amendments: true },
    });

    if (!po) return res.status(404).json({ error: 'Purchase Order not found.' });

    const newVersion = po.amendments.length + 1;

    // Create amendment log
    await prisma.pOAmendment.create({
      data: {
        poId,
        version: newVersion,
        amendedById: user.id,
        amendedByName: user.name,
        changesJson: JSON.stringify(changes),
        justification,
        approved: true,
      },
    });

    // Apply amendments to PO line items
    let newTotal = 0.0;
    for (const change of changes) {
      const line = await prisma.pOLineItem.findFirst({
        where: { poId, description: change.description },
      });

      if (line) {
        const itemQty = parseFloat(change.quantity);
        const itemPrice = parseFloat(change.unitPrice);
        newTotal += itemQty * itemPrice;

        await prisma.pOLineItem.update({
          where: { id: line.id },
          data: {
            quantity: itemQty,
            unitPrice: itemPrice,
            totalPrice: itemQty * itemPrice,
          },
        });
      }
    }

    // Update PO amount
    const updatedPo = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        totalAmount: newTotal,
      },
    });

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PO_AMENDED',
      entityType: 'PO',
      entityId: poId,
      details: `PO ${po.code} amended to Version ${newVersion}. Budget adjustments applied. New amount: $${newTotal.toFixed(2)}.`,
    });

    res.json(updatedPo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. Goods Receipts (GRN)
// ==========================================

router.post('/po/:id/grn', async (req, res) => {
  const poId = req.params.id;
  const { deliveryNoteNumber, items, notes } = req.body; // items: array of { poLineId, quantityReceived, remarks }
  const userHeader = req.headers['x-user-metadata'] as string;
  const user = userHeader ? JSON.parse(userHeader) : { id: 'receiver', name: 'Warehouse Clerk', role: 'PROCUREMENT_OFFICER' };

  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { lineItems: true },
    });

    if (!po) return res.status(404).json({ error: 'Purchase order not found.' });

    // Segregation of Duties (SoD) enforcement
    if (po.createdById === user.id) {
      return res.status(403).json({
        error: 'SEGREGATION_OF_DUTIES_VIOLATION',
        message: 'Compliance Policy: The warehouse receipt must be recorded by a person other than the original PO requisition initiator.',
      });
    }

    const grnCode = `GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const grn = await prisma.goodsReceiptNote.create({
      data: {
        poId,
        poCode: po.code,
        code: grnCode,
        receivedById: user.id,
        receivedByName: user.name,
        deliveryNoteNumber,
        notes,
      },
    });

    let allReceived = true;

    for (const item of items) {
      const poLine = po.lineItems.find(l => l.id === item.poLineId);
      if (!poLine) continue;

      const qtyReceived = parseFloat(item.quantityReceived);
      const newReceivedQty = poLine.receivedQuantity + qtyReceived;

      // Update received qty in PO line
      await prisma.pOLineItem.update({
        where: { id: poLine.id },
        data: {
          receivedQuantity: newReceivedQty,
        },
      });

      // Create GRN line
      await prisma.gRNLineItem.create({
        data: {
          grnId: grn.id,
          description: poLine.description,
          quantityOrdered: poLine.quantity,
          quantityReceived: qtyReceived,
          remarks: item.remarks,
        },
      });

      if (newReceivedQty < poLine.quantity) {
        allReceived = false;
      }
    }

    // Update PO status
    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: allReceived ? 'ISSUED' : 'PARTIALLY_RECEIVED',
      },
    });

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'GRN_CREATED',
      entityType: 'GRN',
      entityId: grn.id,
      details: `Goods Receipt ${grnCode} recorded against PO ${po.code}. Delivery Note No: ${deliveryNoteNumber}.`,
    });

    res.status(201).json(grn);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. Invoicing & 3-Way Match Engine
// ==========================================

router.post('/po/:id/invoice', async (req, res) => {
  const poId = req.params.id;
  const { invoiceNumber, amount, items } = req.body; // items: array of { description, quantity, unitPrice }
  const userHeader = req.headers['x-user-metadata'] as string;
  const user = userHeader ? JSON.parse(userHeader) : { id: 'clerk', name: 'Invoice Clerk', role: 'FINANCE_OFFICER' };

  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { lineItems: true, grns: { include: { lineItems: true } } },
    });

    if (!po) return res.status(404).json({ error: 'Purchase Order target not found.' });

    const invCode = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const tax = amount * 0.07; // 7% standard Liberia tax simulation
    const totalAmount = amount + tax;

    const invoice = await prisma.invoice.create({
      data: {
        poId,
        poCode: po.code,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        code: invCode,
        invoiceNumber,
        amount: parseFloat(amount),
        taxAmount: tax,
        totalAmount,
        status: 'UNDER_MATCHING',
        matchStatus: 'NOT_STARTED',
        invoiceDate: new Date(),
      },
    });

    // Create Invoice line items
    for (const item of items) {
      await prisma.invoiceLineItem.create({
        data: {
          invoiceId: invoice.id,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice),
        },
      });
    }

    // ==========================================
    // EXECUTE 3-WAY MATCHING ENGINE
    // ==========================================
    let quantityMatch = true;
    let priceMatch = true;
    const poFound = true;
    const grnFound = po.grns.length > 0;
    const lineResults: any[] = [];

    for (const item of items) {
      const poLine = po.lineItems.find(l => l.description.toLowerCase() === item.description.toLowerCase());
      
      // Calculate total quantity received in all GRNs for this description
      const totalRec = po.grns.reduce((sum, g) => {
        const gl = g.lineItems.find(l => l.description.toLowerCase() === item.description.toLowerCase());
        return sum + (gl ? gl.quantityReceived : 0.0);
      }, 0.0);

      const qtyRequested = parseFloat(item.quantity);
      const priceRequested = parseFloat(item.unitPrice);

      const itemQtyMatch = qtyRequested <= totalRec;
      const itemPriceMatch = poLine ? priceRequested <= poLine.unitPrice : false;

      if (!itemQtyMatch) quantityMatch = false;
      if (!itemPriceMatch) priceMatch = false;

      lineResults.push({
        description: item.description,
        poQty: poLine ? poLine.quantity : 0,
        grnQty: totalRec,
        invQty: qtyRequested,
        poPrice: poLine ? poLine.unitPrice : 0,
        invPrice: priceRequested,
        qtyMatch: itemQtyMatch,
        priceMatch: itemPriceMatch,
      });
    }

    const matched = quantityMatch && priceMatch && grnFound;
    const finalMatchStatus = matched ? 'MATCHED' : 'MISMATCHED';
    const finalInvStatus = matched ? 'APPROVED_FOR_PAYMENT' : 'EXCEPTION';

    // Save match result
    const matchResult = await prisma.threeWayMatchResult.create({
      data: {
        invoiceId: invoice.id,
        poId,
        quantityMatch,
        priceMatch,
        poFound,
        grnFound,
        detailsJson: JSON.stringify({ lineResults }),
      },
    });

    // Update Invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: finalInvStatus,
        matchStatus: finalMatchStatus,
      },
    });

    // If mismatch, raise exception log
    if (!matched) {
      let exceptionType = 'PRICE_VARIANCE';
      if (!grnFound) exceptionType = 'QUANTITY_VARIANCE';
      else if (!quantityMatch) exceptionType = 'QUANTITY_VARIANCE';

      await prisma.workflowException.create({
        data: {
          entityType: 'INVOICE',
          entityId: invoice.id,
          exceptionType,
          resolved: false,
        },
      });
    }

    // Auto-create Payment Request if matched successfully
    let paymentRequest = null;
    if (matched) {
      paymentRequest = await prisma.paymentRequest.create({
        data: {
          invoiceId: invoice.id,
          invoiceCode: invoice.code,
          poCode: po.code,
          supplierId: po.supplierId,
          supplierName: po.supplierName,
          amount: totalAmount,
          bankName: 'EcoBank Liberia',
          bankAccount: 'LR-002-99884-ECO',
          status: 'PENDING_APPROVAL',
        },
      });
    }

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: matched ? 'INVOICE_THREE_WAY_MATCH_SUCCESS' : 'INVOICE_THREE_WAY_MATCH_EXCEPTION',
      entityType: 'INVOICE',
      entityId: invoice.id,
      details: matched 
        ? `Invoice ${invCode} matching passed PO ${po.code} and GRN. Promoted to APPROVED_FOR_PAYMENT.`
        : `Invoice ${invCode} failed 3-Way Match checks. Price Match: ${priceMatch}, Qty Match: ${quantityMatch}, GRN: ${grnFound}. Exception raised.`,
    });

    res.status(201).json({ invoice: updatedInvoice, matchResult, paymentRequest });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve exception manually
router.post('/invoice/:id/override', async (req, res) => {
  const invoiceId = req.params.id;
  const { notes } = req.body;
  const userHeader = req.headers['x-user-metadata'] as string;
  const user = userHeader ? JSON.parse(userHeader) : { id: 'finance', name: 'Finance Manager', role: 'FINANCE_OFFICER' };

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    // Update Invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'APPROVED_FOR_PAYMENT',
        matchStatus: 'FORCE_APPROVED',
      },
    });

    // Close the exception
    const exc = await prisma.workflowException.findFirst({
      where: { entityType: 'INVOICE', entityId: invoiceId, resolved: false },
    });

    if (exc) {
      await prisma.workflowException.update({
        where: { id: exc.id },
        data: {
          resolved: true,
          resolvedById: user.id,
          resolvedByName: user.name,
          resolutionNotes: notes,
          resolvedAt: new Date(),
        },
      });
    }

    // Generate Payment Request
    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        invoiceId: invoice.id,
        invoiceCode: invoice.code,
        poCode: invoice.poCode,
        supplierId: invoice.supplierId,
        supplierName: invoice.supplierName,
        amount: invoice.totalAmount,
        bankName: 'EcoBank Liberia',
        bankAccount: 'LR-002-99884-ECO',
        status: 'PENDING_APPROVAL',
      },
    });

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'INVOICE_EXCEPTION_OVERRIDDEN',
      entityType: 'INVOICE',
      entityId: invoiceId,
      details: `Exception overridden by Finance Director ${user.name}. Resolution: "${notes}". Promoted to payment routing.`,
    });

    res.json({ invoice: updatedInvoice, paymentRequest });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
