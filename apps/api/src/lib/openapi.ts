export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "SOS ProcureSphere 360 API",
    version: "1.0.0",
    description:
      "Versioned REST API for procurement, DMS, finance, supplier portal, and audit workflows."
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local development"
    }
  ],
  tags: [
    { name: "Auth" },
    { name: "Overview" },
    { name: "Suppliers" },
    { name: "Procurement" },
    { name: "Finance" },
    { name: "DMS" },
    { name: "Audit" }
  ],
  paths: {
    "/api/v1/auth/bootstrap": {
      get: {
        tags: ["Auth"],
        summary: "Fetch auth bootstrap data including users, locations, and departments."
      }
    },
    "/api/v1/auth/users": {
      get: {
        tags: ["Auth"],
        summary: "List demo users for login and role switching."
      }
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Start a demo session by email."
      }
    },
    "/api/v1/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Provision a programme requester account and return a signed-in session payload."
      }
    },
    "/api/v1/overview/dashboard": {
      get: {
        tags: ["Overview"],
        summary: "Fetch dashboard counts, KPIs, pending approvals, and workflow coverage."
      }
    },
    "/api/v1/suppliers": {
      get: {
        tags: ["Suppliers"],
        summary: "List suppliers with due diligence and performance data."
      },
      post: {
        tags: ["Suppliers"],
        summary: "Onboard a supplier and create an auditable supplier profile."
      }
    },
    "/api/v1/procurement/requisitions": {
      get: {
        tags: ["Procurement"],
        summary: "List requisitions."
      },
      post: {
        tags: ["Procurement"],
        summary: "Create a requisition with automatic budget check."
      }
    },
    "/api/v1/procurement/requisitions/{id}/approve": {
      post: {
        tags: ["Procurement"],
        summary: "Approve or reject a requisition."
      }
    },
    "/api/v1/procurement/rfx": {
      get: {
        tags: ["Procurement"],
        summary: "List RFx events and supplier submissions."
      }
    },
    "/api/v1/procurement/rfx/{id}/award": {
      post: {
        tags: ["Procurement"],
        summary: "Record an evaluation outcome and supplier award."
      }
    },
    "/api/v1/procurement/purchase-orders": {
      get: {
        tags: ["Procurement"],
        summary: "List purchase orders."
      }
    },
    "/api/v1/procurement/purchase-orders/from-requisition/{id}": {
      post: {
        tags: ["Procurement"],
        summary: "Generate a purchase order from an approved requisition."
      }
    },
    "/api/v1/procurement/purchase-orders/{id}/receive": {
      post: {
        tags: ["Procurement"],
        summary: "Create a GRN or service confirmation and update PO status."
      }
    },
    "/api/v1/procurement/invoices": {
      get: {
        tags: ["Procurement"],
        summary: "List invoices."
      },
      post: {
        tags: ["Procurement"],
        summary: "Submit a supplier or internal invoice."
      }
    },
    "/api/v1/procurement/invoices/{id}/match": {
      post: {
        tags: ["Procurement"],
        summary: "Run 2-way or 3-way matching and return exceptions."
      }
    },
    "/api/v1/finance/budgets": {
      get: {
        tags: ["Finance"],
        summary: "List budget ledgers and current commitment position."
      }
    },
    "/api/v1/finance/payments": {
      get: {
        tags: ["Finance"],
        summary: "List payment requests and banking statuses."
      }
    },
    "/api/v1/finance/payments/from-invoice/{id}": {
      post: {
        tags: ["Finance"],
        summary: "Create a payment request from a matched invoice."
      }
    },
    "/api/v1/finance/payments/{id}/authorize": {
      post: {
        tags: ["Finance"],
        summary: "Authorize and initiate a payment through the banking adapter layer."
      }
    },
    "/api/v1/dms/documents": {
      get: {
        tags: ["DMS"],
        summary: "List documents, versions, retention rules, and linkages."
      }
    },
    "/api/v1/dms/documents/upload": {
      post: {
        tags: ["DMS"],
        summary: "Upload a document, assign metadata, and index OCR text."
      }
    },
    "/api/v1/dms/search": {
      get: {
        tags: ["DMS"],
        summary: "Search documents by metadata or OCR text."
      }
    },
    "/api/v1/dms/audit-pack/{referenceId}": {
      get: {
        tags: ["DMS"],
        summary: "Generate a donor-friendly audit pack bundle."
      }
    },
    "/api/v1/audit/events": {
      get: {
        tags: ["Audit"],
        summary: "Query immutable audit events."
      }
    }
  }
};
