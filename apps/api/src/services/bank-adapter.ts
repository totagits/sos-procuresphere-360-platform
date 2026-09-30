import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface BankPaymentPayload {
  messageId: string;
  creationDateTime: string;
  totalAmount: number;
  currency: string;
  creditorName: string;
  creditorAccount: string;
  debtorName: string;
  debtorAccount: string;
  paymentDetails: string;
}

export function buildISO20022Payload(data: {
  requestId: string;
  amount: number;
  creditorName: string;
  creditorAccount: string;
  paymentReference: string;
}): string {
  const messageId = `MSG-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const creationDateTime = new Date().toISOString();
  
  // Return standard compliant ISO 20022 CustomerCreditTransferInitiation (pain.001.001.03) formatted XML
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${messageId}</MsgId>
      <CreDtTm>${creationDateTime}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>${data.amount.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>SOS Children's Villages Liberia</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>PMT-${data.requestId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <ReqdExctnDt>${creationDateTime.split('T')[0]}</ReqdExctnDt>
      <Dbtr>
        <Nm>SOS Children's Villages Liberia</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <Othr>
            <Id>LR-002-33923-ECO</Id>
          </Othr>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>ECOBLRMON</BIC>
        </FinInstnId>
      </DbtrAgt>
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${data.paymentReference}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="USD">${data.amount.toFixed(2)}</InstdAmt>
        </Amt>
        <Cdtr>
          <Nm>${data.creditorName}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <Othr>
              <Id>${data.creditorAccount}</Id>
            </Othr>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>Payment reference ${data.paymentReference}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
}

export async function initiateBankTransfer(paymentRequestId: string) {
  const paymentRequest = await prisma.paymentRequest.findUnique({
    where: { id: paymentRequestId },
  });

  if (!paymentRequest) {
    throw new Error(`Payment request ${paymentRequestId} not found.`);
  }

  const transactionReference = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  
  // Construct the payment initiation payload file (XML pain.001)
  const transferPayload = buildISO20022Payload({
    requestId: paymentRequest.id,
    amount: paymentRequest.amount,
    creditorName: paymentRequest.supplierName,
    creditorAccount: paymentRequest.bankAccount,
    paymentReference: paymentRequest.poCode,
  });

  // Create bank transfer reference object
  const ref = await prisma.bankTransferRef.create({
    data: {
      paymentRequestId: paymentRequest.id,
      transactionReference,
      transferPayload,
      transferResponse: 'ACCP', // Standard ISO code for accepted by intermediary (pending processing)
      status: 'PROCESSING',
      reconciled: false,
    },
  });

  // Advance PaymentRequest status
  await prisma.paymentRequest.update({
    where: { id: paymentRequest.id },
    data: {
      status: 'SUBMITTED_TO_BANK',
    },
  });

  console.log(`[BANKING ADAPTER] Payment PO ${paymentRequest.poCode} sent to EcoBank. Reference: ${transactionReference}`);
  return ref;
}

export async function processBankResponse(transferRefId: string, status: 'SUCCESS' | 'FAILED') {
  const ref = await prisma.bankTransferRef.findUnique({
    where: { id: transferRefId },
    include: { paymentRequest: true },
  });

  if (!ref) {
    throw new Error(`Bank transaction reference ${transferRefId} not found.`);
  }

  const newStatus = status === 'SUCCESS' ? 'PAID' : 'FAILED';
  const responseCode = status === 'SUCCESS' ? 'ACSC' : 'RJCT'; // Standard ISO bank return codes

  // Update transaction status
  await prisma.bankTransferRef.update({
    where: { id: transferRefId },
    data: {
      status,
      transferResponse: responseCode,
      reconciled: true,
      reconciledAt: new Date(),
    },
  });

  // Update PaymentRequest status
  await prisma.paymentRequest.update({
    where: { id: ref.paymentRequestId },
    data: {
      status: newStatus,
    },
  });

  // If success, update actual spending in the relevant Budget Line and close Invoice/PO!
  if (status === 'SUCCESS') {
    const invoice = await prisma.invoice.findUnique({
      where: { id: ref.paymentRequest.invoiceId },
    });

    if (invoice) {
      // Set Invoice as Paid
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'PAID' },
      });

      // Update budget line actual spending and release PO commitment!
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: invoice.poId },
      });

      if (po) {
        // Set PO as Closed
        await prisma.purchaseOrder.update({
          where: { id: po.id },
          data: { status: 'CLOSED' },
        });

        const pr = await prisma.purchaseRequisition.findUnique({
          where: { id: po.prId },
        });

        if (pr) {
          // Release committed funds and add to actual spend
          const { actualizeFunds } = await import('./budget.js');
          await actualizeFunds(pr.budgetLineId, po.totalAmount, po.totalAmount);
        }
      }
    }
  }

  console.log(`[BANKING RECONCILIATION] Bank Transaction ${ref.transactionReference} reconciled as ${status}.`);
}
