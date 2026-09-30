const permissions = [
    { id: "perm-1", code: "supplier:manage", label: "Manage suppliers", module: "suppliers" },
    { id: "perm-2", code: "pr:create", label: "Create requisitions", module: "procurement" },
    { id: "perm-3", code: "pr:approve", label: "Approve requisitions", module: "procurement" },
    { id: "perm-4", code: "rfx:manage", label: "Manage RFx", module: "procurement" },
    { id: "perm-5", code: "po:manage", label: "Manage POs", module: "procurement" },
    { id: "perm-6", code: "receipt:create", label: "Create receipts", module: "procurement" },
    { id: "perm-7", code: "invoice:match", label: "Match invoices", module: "finance" },
    { id: "perm-8", code: "payment:authorize", label: "Authorize payments", module: "finance" },
    { id: "perm-9", code: "documents:upload", label: "Upload documents", module: "dms" },
    { id: "perm-10", code: "documents:view", label: "View documents", module: "dms" },
    { id: "perm-11", code: "audit:view", label: "View audit events", module: "audit" },
    { id: "perm-12", code: "budget:check", label: "Run budget checks", module: "finance" },
    { id: "perm-13", code: "bid:submit", label: "Submit supplier bids", module: "procurement" },
    { id: "perm-14", code: "invoice:submit", label: "Submit supplier invoices", module: "finance" }
];
const roles = [
    {
        id: "role-admin",
        name: "System Admin",
        description: "Platform administrator with environment and policy control.",
        permissionCodes: permissions.map((permission) => permission.code)
    },
    {
        id: "role-procurement",
        name: "Procurement Officer",
        description: "Owns sourcing, supplier, PO, and audit pack coordination.",
        permissionCodes: ["supplier:manage", "pr:create", "rfx:manage", "po:manage", "documents:upload", "documents:view"]
    },
    {
        id: "role-requester",
        name: "Programme Requester",
        description: "Creates requisitions, attaches supporting records, and tracks approvals.",
        permissionCodes: ["pr:create", "documents:view"]
    },
    {
        id: "role-approver",
        name: "Budget Approver",
        description: "Approves requisitions, awards, and payment requests by threshold.",
        permissionCodes: ["pr:approve", "po:manage", "documents:view"]
    },
    {
        id: "role-finance",
        name: "Finance Controller",
        description: "Executes budget checks, matching, and banking integration.",
        permissionCodes: ["budget:check", "invoice:match", "payment:authorize", "documents:view", "audit:view"]
    },
    {
        id: "role-warehouse",
        name: "Warehouse Officer",
        description: "Handles independent goods receipt and service confirmation.",
        permissionCodes: ["receipt:create", "documents:view"]
    },
    {
        id: "role-auditor",
        name: "Internal Auditor",
        description: "Reads complete audit trails and document histories.",
        permissionCodes: ["documents:view", "audit:view"]
    },
    {
        id: "role-supplier",
        name: "Supplier Portal",
        description: "Allows external supplier bid and invoice submissions.",
        permissionCodes: ["bid:submit", "invoice:submit"]
    }
];
const locations = [
    { id: "loc-monrovia", name: "Monrovia National Office", code: "MRO", region: "Montserrado" },
    { id: "loc-buchanan", name: "Buchanan Children's Village", code: "BCV", region: "Grand Bassa" },
    { id: "loc-kakata", name: "Kakata Vocational Center", code: "KVC", region: "Margibi" }
];
const departments = [
    { id: "dept-proc", name: "Procurement", costCenter: "CC-PRC" },
    { id: "dept-fin", name: "Finance", costCenter: "CC-FIN" },
    { id: "dept-prog", name: "Programmes", costCenter: "CC-PRG" },
    { id: "dept-med", name: "Medical", costCenter: "CC-MED" },
    { id: "dept-fac", name: "Facilities", costCenter: "CC-FAC" }
];
const users = [
    {
        id: "user-admin",
        name: "Martha Kollie",
        email: "admin@sosliberia.org",
        title: "System Administrator",
        roleIds: ["role-admin"],
        departmentId: "dept-proc",
        locationId: "loc-monrovia",
        totpEnabled: true,
        lastLoginAt: "2026-05-28T12:20:00.000Z"
    },
    {
        id: "user-proc",
        name: "David T. Wreh",
        email: "procurement@sosliberia.org",
        title: "Procurement Officer",
        roleIds: ["role-procurement"],
        departmentId: "dept-proc",
        locationId: "loc-monrovia",
        totpEnabled: true,
        lastLoginAt: "2026-05-28T12:18:00.000Z"
    },
    {
        id: "user-approver",
        name: "Cynthia Boakai",
        email: "approver@sosliberia.org",
        title: "National Director",
        roleIds: ["role-approver"],
        departmentId: "dept-fin",
        locationId: "loc-monrovia",
        totpEnabled: true,
        lastLoginAt: "2026-05-28T11:58:00.000Z"
    },
    {
        id: "user-finance",
        name: "Emmanuel S. Nyenkan",
        email: "finance@sosliberia.org",
        title: "Finance Controller",
        roleIds: ["role-finance"],
        departmentId: "dept-fin",
        locationId: "loc-monrovia",
        totpEnabled: true,
        lastLoginAt: "2026-05-28T12:24:00.000Z"
    },
    {
        id: "user-warehouse",
        name: "Rebecca Fofana",
        email: "warehouse@sosliberia.org",
        title: "Warehouse Officer",
        roleIds: ["role-warehouse"],
        departmentId: "dept-fac",
        locationId: "loc-buchanan",
        totpEnabled: false,
        lastLoginAt: "2026-05-28T10:08:00.000Z"
    },
    {
        id: "user-auditor",
        name: "Samuel Diggs",
        email: "auditor@sosliberia.org",
        title: "Internal Auditor",
        roleIds: ["role-auditor"],
        departmentId: "dept-fin",
        locationId: "loc-monrovia",
        totpEnabled: true,
        lastLoginAt: "2026-05-27T16:42:00.000Z"
    },
    {
        id: "user-supplier-1",
        name: "Momo Kpan",
        email: "sales@libstartrading.com",
        title: "Supplier Contact",
        roleIds: ["role-supplier"],
        departmentId: "dept-proc",
        locationId: "loc-monrovia",
        totpEnabled: false,
        lastLoginAt: "2026-05-27T14:31:00.000Z"
    }
];
const suppliers = [
    {
        id: "sup-libstar",
        name: "LibStar Trading Ltd",
        contactName: "Momo Kpan",
        email: "sales@libstartrading.com",
        phone: "+231-770-110-334",
        bankingDetails: "International Bank Liberia | 030-443211-09",
        taxId: "LBR-TAX-1022",
        categories: ["Furniture", "School Supplies", "Electronics"],
        preferred: true,
        status: "active",
        dueDiligenceChecklist: ["Business registration", "Tax clearance", "Bank letter", "Conflict of interest declaration"],
        documents: [
            {
                id: "supdoc-1",
                supplierId: "sup-libstar",
                type: "Tax Clearance",
                fileName: "tax-clearance-2026.pdf",
                expiryDate: "2026-12-31",
                status: "valid"
            },
            {
                id: "supdoc-2",
                supplierId: "sup-libstar",
                type: "Bank Confirmation",
                fileName: "bank-letter.pdf",
                status: "valid"
            }
        ],
        performance: [
            {
                id: "perf-1",
                supplierId: "sup-libstar",
                deliveryScore: 92,
                qualityScore: 90,
                complianceScore: 95,
                comment: "Strong compliance history with responsive delivery updates.",
                evaluatedAt: "2026-05-20T09:00:00.000Z"
            }
        ]
    },
    {
        id: "sup-green",
        name: "Greenlight Energy Services",
        contactName: "Sarah Weah",
        email: "bids@greenlightenergy.lr",
        phone: "+231-886-200-101",
        bankingDetails: "Ecobank Liberia | 040-103355-88",
        taxId: "LBR-TAX-1199",
        categories: ["Solar", "Medical Equipment", "Maintenance"],
        preferred: true,
        status: "active",
        dueDiligenceChecklist: ["Business registration", "Tax clearance", "Insurance", "Integrity declaration"],
        documents: [
            {
                id: "supdoc-3",
                supplierId: "sup-green",
                type: "Integrity Declaration",
                fileName: "integrity-declaration.pdf",
                expiryDate: "2026-09-30",
                status: "expiring"
            }
        ],
        performance: [
            {
                id: "perf-2",
                supplierId: "sup-green",
                deliveryScore: 88,
                qualityScore: 94,
                complianceScore: 91,
                comment: "Very good technical quality and documentation discipline.",
                evaluatedAt: "2026-05-18T11:00:00.000Z"
            }
        ]
    },
    {
        id: "sup-harbor",
        name: "Harbor Medical Systems",
        contactName: "Josephine Toe",
        email: "tenders@harbormedical.lr",
        phone: "+231-777-515-200",
        bankingDetails: "GT Bank Liberia | 090-880021-01",
        taxId: "LBR-TAX-1444",
        categories: ["Medical Equipment", "Cold Chain", "Maintenance"],
        preferred: false,
        status: "active",
        dueDiligenceChecklist: ["Business registration", "Tax clearance", "Conflict declaration"],
        documents: [
            {
                id: "supdoc-4",
                supplierId: "sup-harbor",
                type: "Conflict of Interest Declaration",
                fileName: "coi-declaration.pdf",
                status: "valid"
            }
        ],
        performance: [
            {
                id: "perf-3",
                supplierId: "sup-harbor",
                deliveryScore: 85,
                qualityScore: 93,
                complianceScore: 89,
                comment: "Good specialist supplier with moderate lead times.",
                evaluatedAt: "2026-05-15T14:00:00.000Z"
            }
        ]
    }
];
const budgetLedgers = [
    {
        id: "bud-1",
        projectCode: "EDU-2026-BCV",
        budgetLine: "6100-Furniture",
        donorCode: "DONOR-EU-01",
        planned: 60000,
        committed: 19500,
        actual: 8200,
        mode: "hard"
    },
    {
        id: "bud-2",
        projectCode: "HLT-2026-MRO",
        budgetLine: "7200-ColdChain",
        donorCode: "DONOR-UN-04",
        planned: 120000,
        committed: 52000,
        actual: 26000,
        mode: "soft"
    }
];
const requisitions = [
    {
        id: "pr-001",
        title: "Buchanan classroom furniture replenishment",
        justification: "Replace damaged desks and replenish term opening supplies for 180 learners.",
        requesterId: "user-proc",
        requesterName: "David T. Wreh",
        departmentId: "dept-prog",
        locationId: "loc-buchanan",
        donorCode: "DONOR-EU-01",
        projectCode: "EDU-2026-BCV",
        budgetLine: "6100-Furniture",
        amount: 15200,
        currency: "USD",
        policyRule: "3 quotes mandatory for spend over USD 10,000",
        status: "approved",
        lineItems: [
            { id: "prli-1", description: "Double desk sets", quantity: 60, unit: "set", unitPrice: 180, category: "Furniture" },
            { id: "prli-2", description: "Teacher storage cabinets", quantity: 8, unit: "unit", unitPrice: 250, category: "Furniture" },
            { id: "prli-3", description: "Stationery replenishment", quantity: 1, unit: "lot", unitPrice: 2400, category: "School Supplies" }
        ],
        attachments: ["needs-assessment.pdf", "site-photos.zip"],
        approvals: [
            {
                id: "appr-pr-1",
                approverId: "user-approver",
                approverName: "Cynthia Boakai",
                roleLabel: "National Director",
                thresholdRule: "Above USD 10,000",
                status: "approved",
                actedAt: "2026-05-12T10:00:00.000Z",
                note: "Proceed under donor-compliant 3-quote method."
            },
            {
                id: "appr-pr-2",
                approverId: "user-finance",
                approverName: "Emmanuel S. Nyenkan",
                roleLabel: "Finance Controller",
                thresholdRule: "Budget hard stop confirmation",
                status: "approved",
                actedAt: "2026-05-12T11:15:00.000Z",
                note: "Funds available in EDU-2026-BCV."
            }
        ],
        budgetCheck: {
            id: "bg-check-1",
            budgetLine: "6100-Furniture",
            projectCode: "EDU-2026-BCV",
            planned: 60000,
            committed: 19500,
            actual: 8200,
            available: 32300,
            mode: "hard",
            status: "ok",
            message: "Budget available. Hard check passed.",
            checkedAt: "2026-05-12T09:55:00.000Z"
        },
        createdAt: "2026-05-11T09:30:00.000Z",
        updatedAt: "2026-05-12T11:15:00.000Z"
    },
    {
        id: "pr-002",
        title: "Monrovia clinic vehicle maintenance retainer",
        justification: "Support weekly child rescue and referral movements for the clinic network.",
        requesterId: "user-finance",
        requesterName: "Emmanuel S. Nyenkan",
        departmentId: "dept-med",
        locationId: "loc-monrovia",
        donorCode: "DONOR-UN-04",
        projectCode: "HLT-2026-MRO",
        budgetLine: "7300-Transport",
        amount: 8700,
        currency: "USD",
        policyRule: "1 written quotation permitted under USD 10,000 with approval",
        status: "pending_approval",
        lineItems: [
            { id: "prli-4", description: "Three-month maintenance retainer", quantity: 3, unit: "month", unitPrice: 2900, category: "Maintenance" }
        ],
        attachments: ["fleet-assessment.pdf"],
        approvals: [
            {
                id: "appr-pr-3",
                approverId: "user-approver",
                approverName: "Cynthia Boakai",
                roleLabel: "National Director",
                thresholdRule: "Programme continuity approval",
                status: "pending"
            }
        ],
        budgetCheck: {
            id: "bg-check-2",
            budgetLine: "7300-Transport",
            projectCode: "HLT-2026-MRO",
            planned: 30000,
            committed: 12000,
            actual: 5400,
            available: 12600,
            mode: "soft",
            status: "warning",
            message: "Available budget is positive but below 50 percent of line balance.",
            checkedAt: "2026-05-27T15:20:00.000Z"
        },
        createdAt: "2026-05-27T14:45:00.000Z",
        updatedAt: "2026-05-27T15:20:00.000Z"
    }
];
const rfxs = [
    {
        id: "rfx-001",
        type: "RFQ",
        title: "Solar refrigeration units for Monrovia clinic",
        description: "Supply, install, and commission vaccine-grade solar refrigeration units.",
        closingAt: "2026-05-18T16:00:00.000Z",
        invitedSupplierIds: ["sup-green", "sup-harbor", "sup-libstar"],
        category: "Medical Equipment",
        status: "awarded",
        items: [
            {
                id: "rfxi-1",
                description: "Solar refrigeration units",
                specification: "WHO PQS compliant cold chain unit with 48-hour autonomy",
                quantity: 4,
                unit: "unit",
                unitPrice: 0,
                category: "Medical Equipment"
            }
        ],
        evaluationCriteria: [
            { id: "crit-1", label: "Price", weight: 35 },
            { id: "crit-2", label: "Compliance", weight: 30 },
            { id: "crit-3", label: "Lead time", weight: 20 },
            { id: "crit-4", label: "Warranty and support", weight: 15 }
        ],
        bids: [
            {
                id: "bid-1",
                rfxId: "rfx-001",
                supplierId: "sup-green",
                supplierName: "Greenlight Energy Services",
                submittedAt: "2026-05-18T13:44:00.000Z",
                totalAmount: 42800,
                currency: "USD",
                leadTimeDays: 16,
                warrantyMonths: 24,
                complianceStatement: "Fully compliant with requested PQS specification.",
                documents: [{ id: "bdoc-1", title: "Technical proposal", fileName: "greenlight-tech-proposal.pdf" }],
                lineComparisons: [{ itemId: "rfxi-1", unitPrice: 10700, leadTimeDays: 16, compliant: true }]
            },
            {
                id: "bid-2",
                rfxId: "rfx-001",
                supplierId: "sup-harbor",
                supplierName: "Harbor Medical Systems",
                submittedAt: "2026-05-18T14:20:00.000Z",
                totalAmount: 44800,
                currency: "USD",
                leadTimeDays: 14,
                warrantyMonths: 18,
                complianceStatement: "Compliant, pending local spares delivery option.",
                documents: [{ id: "bdoc-2", title: "Bid package", fileName: "harbor-bid.pdf" }],
                lineComparisons: [{ itemId: "rfxi-1", unitPrice: 11200, leadTimeDays: 14, compliant: true }]
            }
        ],
        evaluation: [
            {
                bidId: "bid-1",
                totalScore: 91,
                criteriaScores: [
                    { criterionId: "crit-1", score: 32, note: "Lowest evaluated price." },
                    { criterionId: "crit-2", score: 28, note: "Full compliance confirmed." },
                    { criterionId: "crit-3", score: 17, note: "Lead time acceptable." },
                    { criterionId: "crit-4", score: 14, note: "Strong after-sales support." }
                ],
                committeeNotes: "Recommended for award based on best combined commercial and technical score.",
                recommended: true
            },
            {
                bidId: "bid-2",
                totalScore: 84,
                criteriaScores: [
                    { criterionId: "crit-1", score: 28, note: "Higher evaluated price." },
                    { criterionId: "crit-2", score: 27, note: "Compliant with minor clarification." },
                    { criterionId: "crit-3", score: 18, note: "Best lead time." },
                    { criterionId: "crit-4", score: 11, note: "Shorter warranty." }
                ],
                committeeNotes: "Technically solid but not the lowest costed option.",
                recommended: false
            }
        ],
        award: {
            id: "award-1",
            rfxId: "rfx-001",
            bidId: "bid-1",
            supplierId: "sup-green",
            supplierName: "Greenlight Energy Services",
            recommendation: "Awarded to Greenlight as best evaluated bidder.",
            approvedBy: "user-approver",
            approvedAt: "2026-05-20T15:20:00.000Z"
        },
        featureFlags: {
            reverseAuction: false
        }
    }
];
const purchaseOrders = [
    {
        id: "po-001",
        sourceRequisitionId: "pr-001",
        supplierId: "sup-libstar",
        supplierName: "LibStar Trading Ltd",
        amount: 15200,
        currency: "USD",
        projectCode: "EDU-2026-BCV",
        budgetLine: "6100-Furniture",
        status: "partially_received",
        approvals: [
            {
                id: "po-appr-1",
                approverId: "user-approver",
                approverName: "Cynthia Boakai",
                roleLabel: "National Director",
                thresholdRule: "PO over USD 15,000",
                status: "approved",
                actedAt: "2026-05-13T10:30:00.000Z",
                note: "Issue immediately to maintain school opening timeline."
            }
        ],
        amendments: [
            {
                id: "po-amd-1",
                poId: "po-001",
                version: 2,
                summary: "Adjusted stationery bundle composition with no value change.",
                approvedBy: "user-approver",
                approvedAt: "2026-05-16T11:20:00.000Z"
            }
        ],
        lines: [
            { id: "prli-1", description: "Double desk sets", quantity: 60, unit: "set", unitPrice: 180, category: "Furniture" },
            { id: "prli-2", description: "Teacher storage cabinets", quantity: 8, unit: "unit", unitPrice: 250, category: "Furniture" },
            { id: "prli-3", description: "Stationery replenishment", quantity: 1, unit: "lot", unitPrice: 2400, category: "School Supplies" }
        ],
        issuedAt: "2026-05-13T15:00:00.000Z",
        createdAt: "2026-05-13T09:15:00.000Z"
    },
    {
        id: "po-002",
        sourceAwardId: "award-1",
        supplierId: "sup-green",
        supplierName: "Greenlight Energy Services",
        amount: 42800,
        currency: "USD",
        projectCode: "HLT-2026-MRO",
        budgetLine: "7200-ColdChain",
        status: "issued",
        approvals: [
            {
                id: "po-appr-2",
                approverId: "user-approver",
                approverName: "Cynthia Boakai",
                roleLabel: "National Director",
                thresholdRule: "Donor-funded medical equipment",
                status: "approved",
                actedAt: "2026-05-21T09:15:00.000Z",
                note: "Award endorsed with donor visibility."
            }
        ],
        amendments: [],
        lines: [
            { id: "rfxi-1", description: "Solar refrigeration units", quantity: 4, unit: "unit", unitPrice: 10700, category: "Medical Equipment" }
        ],
        issuedAt: "2026-05-21T12:00:00.000Z",
        createdAt: "2026-05-21T09:00:00.000Z"
    }
];
const receipts = [
    {
        id: "grn-001",
        poId: "po-001",
        receiverId: "user-warehouse",
        receiverName: "Rebecca Fofana",
        type: "goods",
        receivedAt: "2026-05-19T10:10:00.000Z",
        status: "partial",
        lines: [
            { lineItemId: "prli-1", receivedQuantity: 40, acceptedQuantity: 40 },
            { lineItemId: "prli-2", receivedQuantity: 8, acceptedQuantity: 8 }
        ],
        note: "Stationery replenishment still in transit."
    }
];
const invoices = [
    {
        id: "inv-001",
        poId: "po-001",
        supplierId: "sup-libstar",
        supplierName: "LibStar Trading Ltd",
        invoiceNumber: "LST-INV-2026-051",
        amount: 12800,
        currency: "USD",
        submittedAt: "2026-05-20T13:30:00.000Z",
        submittedBy: "supplier_portal",
        status: "approved",
        lines: [
            { id: "invli-1", description: "Double desk sets", quantity: 40, unit: "set", unitPrice: 180, category: "Furniture" },
            { id: "invli-2", description: "Teacher storage cabinets", quantity: 8, unit: "unit", unitPrice: 250, category: "Furniture" }
        ],
        matchResult: {
            id: "match-1",
            invoiceId: "inv-001",
            matchType: "3-way",
            status: "matched",
            exceptions: [],
            checkedAt: "2026-05-21T08:30:00.000Z"
        }
    }
];
const paymentRequests = [
    {
        id: "pay-001",
        invoiceId: "inv-001",
        amount: 12800,
        currency: "USD",
        status: "initiated",
        approvals: [
            {
                id: "pay-appr-1",
                approverId: "user-finance",
                approverName: "Emmanuel S. Nyenkan",
                status: "approved",
                actedAt: "2026-05-21T10:00:00.000Z",
                note: "3-way match clean. Ready for bank handoff."
            },
            {
                id: "pay-appr-2",
                approverId: "user-approver",
                approverName: "Cynthia Boakai",
                status: "approved",
                actedAt: "2026-05-21T10:40:00.000Z",
                note: "Authorized under dual control."
            }
        ],
        bankTransferRef: {
            id: "bank-ref-1",
            paymentRequestId: "pay-001",
            adapter: "mock-bank",
            bankReference: "MBK-20260521-43812",
            status: "initiated",
            updatedAt: "2026-05-21T11:00:00.000Z"
        },
        reconciliation: {
            id: "recon-1",
            paymentRequestId: "pay-001",
            matched: false,
            bankStatementRef: "PENDING-STATEMENT"
        }
    }
];
const retentionPolicies = [
    { id: "ret-1", category: "Procurement Case", retainYears: 7, archiveAfterDays: 365, legalHoldAllowed: true },
    { id: "ret-2", category: "Payment Support", retainYears: 10, archiveAfterDays: 180, legalHoldAllowed: true },
    { id: "ret-3", category: "Supplier Due Diligence", retainYears: 6, archiveAfterDays: 270, legalHoldAllowed: true }
];
const documents = [
    {
        id: "doc-1",
        title: "PR-001 Needs Assessment",
        docType: "Needs Assessment",
        metadata: [
            { key: "supplier", value: "N/A" },
            { key: "project", value: "EDU-2026-BCV" },
            { key: "reference", value: "PR-001" }
        ],
        relatedEntities: [{ type: "requisition", id: "pr-001" }],
        uploadedBy: "user-proc",
        uploadedAt: "2026-05-11T09:35:00.000Z",
        updatedAt: "2026-05-11T09:35:00.000Z",
        ocrText: "SOS Buchanan classroom desk replacement request for 180 learners and teacher storage cabinets.",
        currentVersionId: "docver-1",
        versions: [
            {
                id: "docver-1",
                label: "v1",
                fileName: "needs-assessment.pdf",
                uploadedBy: "user-proc",
                uploadedAt: "2026-05-11T09:35:00.000Z",
                hash: "sha256-need-assess"
            }
        ],
        permissions: [
            { roleId: "role-procurement", level: "edit" },
            { roleId: "role-finance", level: "view" },
            { roleId: "role-auditor", level: "download" }
        ],
        retentionPolicyId: "ret-1",
        archived: false,
        archiveDueAt: "2027-05-11T09:35:00.000Z"
    },
    {
        id: "doc-2",
        title: "RFQ Evaluation Committee Minutes",
        docType: "Evaluation Report",
        supplierId: "sup-green",
        metadata: [
            { key: "reference", value: "RFX-001" },
            { key: "project", value: "HLT-2026-MRO" },
            { key: "amount", value: "42800" }
        ],
        relatedEntities: [{ type: "rfx", id: "rfx-001" }, { type: "po", id: "po-002" }],
        uploadedBy: "user-proc",
        uploadedAt: "2026-05-20T14:30:00.000Z",
        updatedAt: "2026-05-20T14:30:00.000Z",
        ocrText: "Evaluation committee reviewed Greenlight and Harbor submissions. Greenlight recommended for award.",
        currentVersionId: "docver-2",
        versions: [
            {
                id: "docver-2",
                label: "v1",
                fileName: "rfq-evaluation-minutes.pdf",
                uploadedBy: "user-proc",
                uploadedAt: "2026-05-20T14:30:00.000Z",
                hash: "sha256-eval-minutes"
            }
        ],
        permissions: [
            { roleId: "role-procurement", level: "edit" },
            { roleId: "role-finance", level: "view" },
            { roleId: "role-auditor", level: "download" }
        ],
        retentionPolicyId: "ret-1",
        archived: false,
        archiveDueAt: "2027-05-20T14:30:00.000Z"
    },
    {
        id: "doc-3",
        title: "LibStar Supplier Invoice",
        docType: "Invoice",
        supplierId: "sup-libstar",
        metadata: [
            { key: "reference", value: "INV-001" },
            { key: "po", value: "PO-001" },
            { key: "amount", value: "12800" }
        ],
        relatedEntities: [{ type: "invoice", id: "inv-001" }, { type: "po", id: "po-001" }],
        uploadedBy: "user-supplier-1",
        uploadedAt: "2026-05-20T13:30:00.000Z",
        updatedAt: "2026-05-20T13:30:00.000Z",
        ocrText: "Invoice number LST-INV-2026-051 for Buchanan classroom furniture partial delivery.",
        currentVersionId: "docver-3",
        versions: [
            {
                id: "docver-3",
                label: "v1",
                fileName: "libstar-invoice.pdf",
                uploadedBy: "user-supplier-1",
                uploadedAt: "2026-05-20T13:30:00.000Z",
                hash: "sha256-invoice"
            }
        ],
        permissions: [
            { roleId: "role-procurement", level: "view" },
            { roleId: "role-finance", level: "edit" },
            { roleId: "role-auditor", level: "download" }
        ],
        retentionPolicyId: "ret-2",
        archived: false,
        archiveDueAt: "2026-11-16T13:30:00.000Z"
    }
];
const archiveLog = [];
const auditEvents = [
    {
        id: "audit-1",
        actorId: "user-proc",
        actorName: "David T. Wreh",
        action: "PR_SUBMITTED",
        entityType: "Requisition",
        entityId: "pr-001",
        occurredAt: "2026-05-11T09:30:00.000Z",
        detail: "Created classroom furniture requisition with donor coding."
    },
    {
        id: "audit-2",
        actorId: "user-finance",
        actorName: "Emmanuel S. Nyenkan",
        action: "BUDGET_CHECK_COMPLETED",
        entityType: "Requisition",
        entityId: "pr-001",
        occurredAt: "2026-05-12T09:55:00.000Z",
        detail: "Hard budget check passed with USD 32,300 available."
    },
    {
        id: "audit-3",
        actorId: "user-approver",
        actorName: "Cynthia Boakai",
        action: "RFX_AWARDED",
        entityType: "RFx",
        entityId: "rfx-001",
        occurredAt: "2026-05-20T15:20:00.000Z",
        detail: "Approved award recommendation to Greenlight Energy Services."
    },
    {
        id: "audit-4",
        actorId: "user-warehouse",
        actorName: "Rebecca Fofana",
        action: "GRN_CREATED",
        entityType: "GoodsReceipt",
        entityId: "grn-001",
        occurredAt: "2026-05-19T10:10:00.000Z",
        detail: "Partial delivery received independently from requester and approver."
    },
    {
        id: "audit-5",
        actorId: "user-finance",
        actorName: "Emmanuel S. Nyenkan",
        action: "PAYMENT_INITIATED",
        entityType: "PaymentRequest",
        entityId: "pay-001",
        occurredAt: "2026-05-21T11:00:00.000Z",
        detail: "Mock bank adapter initiated payment with reference MBK-20260521-43812."
    }
];
const notifications = [
    {
        id: "notif-1",
        title: "Approval pending on PR-002",
        body: "Vehicle maintenance retainer awaits National Director decision within 8 hours.",
        severity: "warning",
        audienceRoleIds: ["role-approver"],
        dueAt: "2026-05-28T18:00:00.000Z",
        escalated: false
    },
    {
        id: "notif-2",
        title: "Supplier integrity declaration expiring",
        body: "Greenlight Energy Services integrity declaration expires in 125 days.",
        severity: "info",
        audienceRoleIds: ["role-procurement"],
        dueAt: "2026-05-30T09:00:00.000Z",
        escalated: false
    }
];
const metrics = {
    spendBySupplier: [
        { label: "LibStar Trading Ltd", value: 15200 },
        { label: "Greenlight Energy Services", value: 42800 },
        { label: "Harbor Medical Systems", value: 0 }
    ],
    spendByCategory: [
        { label: "Furniture", value: 12800 },
        { label: "School Supplies", value: 2400 },
        { label: "Medical Equipment", value: 42800 }
    ],
    spendByLocation: [
        { label: "Buchanan", value: 15200 },
        { label: "Monrovia", value: 42800 },
        { label: "Kakata", value: 0 }
    ],
    cycleTimes: [
        { label: "PR to PO", value: 2.5 },
        { label: "PO to GRN", value: 6.2 },
        { label: "Invoice to Approved", value: 1.3 }
    ],
    complianceRates: [
        { label: "3 quotes policy", value: 96 },
        { label: "SoD compliance", value: 100 },
        { label: "Audit pack completeness", value: 98 }
    ],
    budgetUtilization: [
        { label: "EDU-2026-BCV", value: 46 },
        { label: "HLT-2026-MRO", value: 65 }
    ]
};
export const demoState = {
    name: "SOS ProcureSphere 360",
    generatedAt: "2026-05-28T12:30:00.000Z",
    permissions,
    roles,
    locations,
    departments,
    users,
    suppliers,
    budgetLedgers,
    requisitions,
    rfxs,
    purchaseOrders,
    receipts,
    invoices,
    paymentRequests,
    retentionPolicies,
    archiveLog,
    documents,
    auditEvents,
    notifications,
    metrics
};
