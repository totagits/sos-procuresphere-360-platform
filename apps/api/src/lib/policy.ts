import type { ApprovalStep, AppState, BudgetCheckResult, GoodsReceipt, Permission, PurchaseOrder, User } from "@sos-procuresphere/shared";

export const getUser = (state: AppState, userId?: string): User => {
  const user = state.users.find((entry) => entry.id === userId) ?? state.users[0];
  return user;
};

export const getPermissionsForUser = (state: AppState, userId: string): Permission[] => {
  const user = getUser(state, userId);
  const rolePermissions = state.roles
    .filter((role) => user.roleIds.includes(role.id))
    .flatMap((role) => role.permissionCodes);

  return state.permissions.filter((permission) => rolePermissions.includes(permission.code));
};

export const ensurePermission = (state: AppState, userId: string, permissionCode: string): void => {
  const hasPermission = getPermissionsForUser(state, userId).some((permission) => permission.code === permissionCode);
  if (!hasPermission) {
    throw new Error(`Permission ${permissionCode} is required for this action.`);
  }
};

export const computeBudgetCheck = (state: AppState, projectCode: string, budgetLine: string, amount: number): BudgetCheckResult => {
  const ledger = state.budgetLedgers.find((entry) => entry.projectCode === projectCode && entry.budgetLine === budgetLine);

  if (!ledger) {
    return {
      id: `budget-check-${Date.now()}`,
      budgetLine,
      projectCode,
      planned: 0,
      committed: 0,
      actual: 0,
      available: 0,
      mode: "hard",
      status: "blocked",
      message: "No budget ledger found for selected project and line.",
      checkedAt: new Date().toISOString()
    };
  }

  const available = ledger.planned - ledger.committed - ledger.actual;
  const status = available >= amount ? "ok" : ledger.mode === "hard" ? "blocked" : "warning";

  return {
    id: `budget-check-${Date.now()}`,
    budgetLine,
    projectCode,
    planned: ledger.planned,
    committed: ledger.committed,
    actual: ledger.actual,
    available,
    mode: ledger.mode,
    status,
    message:
      status === "ok"
        ? "Budget available for commitment."
        : ledger.mode === "hard"
          ? "Budget blocked by hard stop policy."
          : "Budget below requested amount, soft warning triggered.",
    checkedAt: new Date().toISOString()
  };
};

export const canApprove = (actorId: string, requesterId: string): boolean => actorId !== requesterId;

export const canReceive = (actorId: string, po: PurchaseOrder, receipts: GoodsReceipt[]): boolean => {
  const existingReceivers = receipts.filter((receipt) => receipt.poId === po.id).map((receipt) => receipt.receiverId);
  const approvers = po.approvals.map((approval) => approval.approverId);
  return !approvers.includes(actorId) && !existingReceivers.includes(actorId);
};

export const nextPendingApproval = (approvals: ApprovalStep[]): ApprovalStep | undefined =>
  approvals.find((approval) => approval.status === "pending");
