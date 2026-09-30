import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function logAuditEvent(params: {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: 'USER' | 'SUPPLIER' | 'PR' | 'RFQ' | 'PO' | 'GRN' | 'INVOICE' | 'PAYMENT' | 'DOCUMENT';
  entityId: string;
  details: string;
  ipAddress?: string;
}) {
  const timestamp = new Date();
  
  // Create cryptographic hash seal simulation of this event to ensure immutability
  const hashString = `${timestamp.toISOString()}-${params.userId}-${params.action}-${params.entityType}-${params.entityId}-${params.details}`;
  const integrityHash = crypto.createHash('sha256').update(hashString).digest('hex');

  const auditLog = await prisma.auditLog.create({
    data: {
      timestamp,
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details,
      ipAddress: params.ipAddress || '127.0.0.1',
      integrityHash,
    },
  });

  console.log(`[AUDIT LEDGER] Event: ${params.action} on ${params.entityType} (ID: ${params.entityId}) signed. Hash: ${integrityHash.substring(0, 16)}...`);
  return auditLog;
}
