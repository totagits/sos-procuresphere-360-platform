import { Router } from "express";
import { auditRouter } from "../modules/audit/audit.routes";
import { authRouter } from "../modules/auth/auth.routes";
import { dmsRouter } from "../modules/dms/dms.routes";
import { financeRouter } from "../modules/finance/finance.routes";
import { overviewRouter } from "../modules/overview/overview.routes";
import { procurementRouter } from "../modules/procurement/procurement.routes";
import { suppliersRouter } from "../modules/suppliers/suppliers.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/overview", overviewRouter);
apiRouter.use("/suppliers", suppliersRouter);
apiRouter.use("/procurement", procurementRouter);
apiRouter.use("/finance", financeRouter);
apiRouter.use("/dms", dmsRouter);
apiRouter.use("/audit", auditRouter);
