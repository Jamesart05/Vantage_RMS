import { Router } from "express";
import { onboardingRouter } from "../modules/onboarding/onboarding.routes";
import { organizationRouter } from "../modules/organizations/organization.routes";
import { memberRouter } from "../modules/members/member.routes";
import { settingsRouter } from "../modules/settings/settings.routes";
import { auditRouter } from "../modules/audit/audit.routes";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes";
import { departmentRouter } from "../modules/departments/department.routes";
import { employeeRouter } from "../modules/employees/employee.routes";
import { categoryRouter } from "../modules/categories/category.routes";
import { productRouter } from "../modules/products/product.routes";
import { inventoryRouter } from "../modules/inventory/inventory.routes";
import { supplierRouter } from "../modules/suppliers/supplier.routes";
import { purchaseRouter } from "../modules/purchases/purchase.routes";
import { productionRouter } from "../modules/production/production.routes";
import { saleRouter } from "../modules/sales/sale.routes";
import { financeRouter } from "../modules/finance/finance.routes";

export const apiRouter = Router();

apiRouter.use("/onboarding", onboardingRouter);
apiRouter.use("/organizations", organizationRouter);
apiRouter.use("/members", memberRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/audit-logs", auditRouter);
apiRouter.use("/dashboard", dashboardRouter);

apiRouter.use("/departments", departmentRouter);
apiRouter.use("/employees", employeeRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/inventory", inventoryRouter);
apiRouter.use("/suppliers", supplierRouter);
apiRouter.use("/purchases", purchaseRouter);
apiRouter.use("/production", productionRouter);
apiRouter.use("/sales", saleRouter);
apiRouter.use("/finance", financeRouter);
