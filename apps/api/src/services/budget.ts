import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface BudgetCheckResult {
  passed: boolean;
  mode: 'SOFT_CHECK' | 'HARD_CHECK';
  requestedAmount: number;
  availableAmount: number;
  message: string;
  budgetLineCode: string;
}

export async function checkBudget(budgetLineId: string, amount: number): Promise<BudgetCheckResult> {
  const budget = await prisma.budgetLine.findUnique({
    where: { id: budgetLineId },
  });

  if (!budget) {
    throw new Error(`Budget line with ID ${budgetLineId} not found.`);
  }

  const remaining = budget.allocated - budget.committed - budget.actual;
  
  // Set policy boundaries:
  // Purchases over $1,500 enforce hard block rules if they exceed the remaining budget.
  // Purchases under $1,500 trigger soft check warnings but are allowed to pass.
  const isHardCheck = amount > 1500.0;
  const passed = remaining >= amount;

  let message = '';
  if (passed) {
    message = `Real-time Budget check successful: $${amount} fits within remaining allocation of $${remaining.toFixed(2)} for ${budget.code}.`;
  } else {
    if (isHardCheck) {
      message = `REAL-TIME BUDGET OVERRUN BLOCKED (Hard Control): Request of $${amount} exceeds the available grant balance of $${remaining.toFixed(2)} for ${budget.code}. Action canceled.`;
    } else {
      message = `Budget Warning (Soft Control): Request of $${amount} exceeds available grant balance of $${remaining.toFixed(2)} for ${budget.code}, but is permitted by small-threshold local policy.`;
    }
  }

  return {
    passed: passed || !isHardCheck, // In soft mode, always let it pass
    mode: isHardCheck ? 'HARD_CHECK' : 'SOFT_CHECK',
    requestedAmount: amount,
    availableAmount: remaining,
    message,
    budgetLineCode: budget.code,
  };
}

export async function commitFunds(budgetLineId: string, amount: number) {
  const budget = await prisma.budgetLine.findUnique({ where: { id: budgetLineId } });
  if (!budget) return;

  await prisma.budgetLine.update({
    where: { id: budgetLineId },
    data: {
      committed: budget.committed + amount,
    },
  });
  console.log(`[COMMITMENT CONTROL] Committed $${amount} to budget line ${budget.code}`);
}

export async function actualizeFunds(budgetLineId: string, committedAmount: number, actualAmount: number) {
  const budget = await prisma.budgetLine.findUnique({ where: { id: budgetLineId } });
  if (!budget) return;

  await prisma.budgetLine.update({
    where: { id: budgetLineId },
    data: {
      committed: Math.max(0.0, budget.committed - committedAmount),
      actual: budget.actual + actualAmount,
    },
  });
  console.log(`[COMMITMENT CONTROL] Actualized spend: $${actualAmount} paid, released $${committedAmount} commitment on budget ${budget.code}`);
}

export async function releaseCommittedFunds(budgetLineId: string, amount: number) {
  const budget = await prisma.budgetLine.findUnique({ where: { id: budgetLineId } });
  if (!budget) return;

  await prisma.budgetLine.update({
    where: { id: budgetLineId },
    data: {
      committed: Math.max(0.0, budget.committed - amount),
    },
  });
  console.log(`[COMMITMENT CONTROL] Released $${amount} commitment on budget ${budget.code}`);
}
