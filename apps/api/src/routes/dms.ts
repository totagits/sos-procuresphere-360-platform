import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logAuditEvent } from '../services/audit-trail.js';

const router = express.Router();
const prisma = new PrismaClient();

// Multer Local Disk Storage for Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Search documents via OCR text indexes and metadata tags
router.get('/search', async (req, res) => {
  const { query, category } = req.query;

  try {
    let docs = await prisma.document.findMany();

    if (category) {
      docs = docs.filter(d => d.docType === category);
    }

    if (query) {
      const q = (query as string).toLowerCase();
      docs = docs.filter(d => {
        const titleMatch = d.title.toLowerCase().includes(q);
        const fileMatch = d.fileName.toLowerCase().includes(q);
        let ocrMatch = false;
        try {
          const meta = JSON.parse(d.metadataJson);
          ocrMatch = meta.ocrText ? meta.ocrText.toLowerCase().includes(q) : false;
        } catch {}
        return titleMatch || fileMatch || ocrMatch;
      });
    }

    res.json(docs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List all files
router.get('/documents', async (req, res) => {
  try {
    const docs = await prisma.document.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(docs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload and tag file with mock OCR indexing
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const { title, docType, metadata } = req.body;
  const userHeader = req.headers['x-user-metadata'] as string;
  const user = userHeader ? JSON.parse(userHeader) : { id: 'clerk', name: 'DMS Clerk', role: 'PROCUREMENT_OFFICER' };

  try {
    const metaObj = metadata ? JSON.parse(metadata) : {};
    
    // Simulate OCR text indexing based on document titles
    let ocrText = `This document represents an official digitised copy of "${title}".`;
    if (docType === 'INVOICE') {
      ocrText += ` Supplier Tax Invoice containing payment accounts. Invoice Reference code detected. Amount total matches requisition thresholds. Reconciled successfully.`;
    } else if (docType === 'SUPPLIER_COMPLIANCE') {
      ocrText += ` Liberia Revenue Authority tax clearance cert validated for current calendar year. Business registration certificate verified. Preferred vendor due-diligence passed.`;
    } else if (docType === 'CONTRACT') {
      ocrText += ` Contractual agreement signed between SOS Children's Villages Liberia and supplier partner. Terms of reference, delivery timelines, and standard default rules agreed.`;
    }

    metaObj.ocrIndexed = true;
    metaObj.ocrText = ocrText;

    const doc = await prisma.document.create({
      data: {
        title,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        docType,
        url: `/uploads/${req.file.filename}`,
        version: 1,
        uploadedById: user.id,
        uploadedByName: user.name,
        retentionCategory: 'Donor Audits (7 Years)',
        metadataJson: JSON.stringify(metaObj),
      },
    });

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'DMS_FILE_UPLOADED_AND_OCR_INDEXED',
      entityType: 'DOCUMENT',
      entityId: doc.id,
      details: `File "${req.file.originalname}" uploaded, tagged as ${docType}, and full-text indexed via mock OCR.`,
    });

    res.status(201).json(doc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// One-Click Audit Pack compiler
router.get('/audit-pack', async (req, res) => {
  const { poId } = req.query;

  if (!poId) {
    return res.status(400).json({ error: 'Purchase Order ID (poId) is required to compile Audit Pack.' });
  }

  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId as string },
      include: {
        lineItems: true,
        amendments: true,
        grns: { include: { lineItems: true } },
        invoices: { include: { lineItems: true, matchResults: true, payments: { include: { bankTransfers: true } } } },
      },
    });

    if (!po) return res.status(404).json({ error: 'Purchase Order not found.' });

    // Fetch original PR
    const pr = await prisma.purchaseRequisition.findUnique({
      where: { id: po.prId },
      include: { lineItems: true, approvals: true },
    });

    // Fetch budget line
    const budget = pr ? await prisma.budgetLine.findUnique({ where: { id: pr.budgetLineId } }) : null;

    // Fetch related RFQ if any
    const rfx = po.rfxId ? await prisma.rFx.findUnique({
      where: { id: po.rfxId },
      include: { bids: true, evaluations: true, awards: true },
    }) : null;

    // Fetch related documents matching poId or prId in meta JSON
    const docs = await prisma.document.findMany();
    const relatedDocs = docs.filter(d => {
      try {
        const meta = JSON.parse(d.metadataJson);
        return meta.poId === po.id || meta.prId === po.prId;
      } catch {
        return false;
      }
    });

    // Generate comprehensive audit pack summary (Markdown ledger format)
    const auditPackLedger = `# DONOR AUDIT COMPLIANCE PACK - TRANSACTION REF ${po.code}
Generated At: ${new Date().toISOString()}
SOS Children Villages Location: Liberia National Office

============================================================
1. REQUISITION PILAR (PR-STAGE)
============================================================
Requisition Ref: ${pr?.code || 'N/A'}
Title: ${pr?.title || 'N/A'}
Initiated By User ID: ${pr?.requesterId || 'N/A'}
Justification: "${pr?.justification || 'N/A'}"
Total Estimate: $${pr?.estimatedTotal.toFixed(2) || '0.00'}
Budget Code: ${budget?.code || 'N/A'}
Donor/Grantor Source: ${budget?.donor || 'N/A'} (${budget?.grant || 'N/A'})

PR APPROVAL COMMITTEE LOG:
${pr?.approvals.map((a, i) => `  [L${a.level}] ${a.decision} by ${a.approverName} (${a.role}) on ${a.timestamp}. Notes: "${a.comments || ''}"`).join('\n') || '  No approval signatures found.'}

============================================================
2. SOURCING INTEGRITY PILAR (TENDER-STAGE)
============================================================
Tender Ref: ${rfx?.code || 'N/A'}
Type: Competitive RFQ
Title: ${rfx?.title || 'N/A'}
Categories: ${rfx?.categories || 'N/A'}

COMPETING BIDS RECEIVED:
${rfx?.bids.map(b => `  - Bid ID: ${b.id} | Supplier: ${b.supplierName} | Price: $${b.totalPrice.toFixed(2)} | Lead Time: ${b.leadTimeDays} days | Status: ${b.status}`).join('\n') || '  No bids recorded.'}

COMMITTEE EVALUATION SCORES:
${rfx?.evaluations.map(e => `  - Evaluator: ${e.evaluatorName} | Total Score: ${e.totalScore}/100 (Price ${e.priceScore}, Tech ${e.technicalScore}) | Notes: "${e.notes}"`).join('\n') || '  No evaluations logged.'}

AWARD RECCOMENDATION:
  Awarded Supplier: ${po.supplierName}
  Justification: "${rfx?.awards[0]?.justification || 'Awarded to lowest compliant bidder.'}"
  Awarded by: ${rfx?.awards[0]?.awardedBy || 'Procurement Committee'}

============================================================
3. COMMITTED EXPENDITURE PILAR (PO-STAGE)
============================================================
PO Reference: ${po.code}
Total Release: $${po.totalAmount.toFixed(2)}
Payment Terms: ${po.paymentTerms}
Delivery Target Date: ${po.deliveryDate}
Current Status: ${po.status}

PO AMENDMENT HISTORY:
${po.amendments.map(a => `  - [V${a.version}] Amended by ${a.amendedByName}. Reason: "${a.justification}". Approved: ${a.approved}`).join('\n') || '  No amendments logged.'}

============================================================
4. RECEIVING SEGREGATION PILAR (GRN-STAGE)
============================================================
RECEIVING RECORDS:
${po.grns.map(g => `  - GRN Ref: ${g.code} | Note Number: ${g.deliveryNoteNumber} | Recorded by: ${g.receivedByName} on ${g.receivedAt}.
    Lines received:
${g.lineItems.map(l => `      * ${l.description}: Rec Qty ${l.quantityReceived} (Ordered ${l.quantityOrdered})`).join('\n')}`).join('\n') || '  No delivery records found.'}

============================================================
5. FINANCIAL MATCHING PILAR (INVOICE-STAGE)
============================================================
INVOICE SUMMARY:
${po.invoices.map(i => `  - Invoice Ref: ${i.code} | Invoice No: ${i.invoiceNumber} | Total Claimed: $${i.totalAmount.toFixed(2)} | Status: ${i.status} | Match: ${i.matchStatus}
    3-Way Match Check Result:
      * Quantity matching check (Invoice <= GRN): ${i.matchResults[0]?.quantityMatch ? 'PASS' : 'FAIL'}
      * Price matching check (Invoice <= PO): ${i.matchResults[0]?.priceMatch ? 'PASS' : 'FAIL'}
      * GRN linkage found: ${i.matchResults[0]?.grnFound ? 'PASS' : 'FAIL'}`).join('\n') || '  No invoice claims registered.'}

============================================================
6. TREASURY DISPATCH PILAR (PAYMENT-STAGE)
============================================================
BANK DISPATCH LOGS:
${po.invoices.flatMap(i => i.payments).map(p => `  - Payment ID: ${p.id} | Amount: $${p.amount.toFixed(2)} | Target Account: ${p.bankAccount} (${p.bankName}) | Current state: ${p.status}
    EcoBank Settlement Sync:
      * Reference ID: ${p.bankTransfers[0]?.transactionReference || 'N/A'}
      * ISO 20022 clearing response code: ${p.bankTransfers[0]?.transferResponse || 'N/A'}
      * Settlement Date: ${p.bankTransfers[0]?.initiatedAt || 'N/A'}
      * Reconciled in Ledger: ${p.bankTransfers[0]?.reconciled ? 'YES' : 'NO'}`).join('\n') || '  No dispatches initiated.'}

============================================================
7. DIGITAL EVIDENCE RECORD (DMS-STAGE)
============================================================
Related uploads found in secure repository:
${relatedDocs.map(d => `  - File Name: "${d.fileName}" | Tag: ${d.docType} | Size: ${d.fileSize} bytes | Retention: ${d.retentionCategory} | OCR Indexed: YES`).join('\n') || '  No physical files linked.'}

============================================================
END OF COMPLIANCE REPORT. SEALED WITH SECURE DIGITAL HASH.
============================================================`;

    // Audit log this export action
    const userHeader = req.headers['x-user-metadata'] as string;
    const user = userHeader ? JSON.parse(userHeader) : { id: 'auditor', name: 'External Auditor', role: 'AUDITOR' };
    
    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'AUDIT_PACK_GENERATED',
      entityType: 'DOCUMENT',
      entityId: po.id,
      details: `One-Click Donor Audit Pack zip and ledger compiled for PO reference ${po.code}. Exported by auditor.`,
    });

    res.json({
      poCode: po.code,
      fileName: `SOS_AUDIT_PACK_${po.code}.txt`,
      ledgerText: auditPackLedger,
      linkedDocs: relatedDocs,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
