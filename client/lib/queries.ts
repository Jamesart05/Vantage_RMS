import { api, type ApiMeta } from "./api";
import type {
  Employee,
  Department,
  Product,
  ProductCategory,
  InventoryItem,
  InventoryMovement,
  Supplier,
  Sale,
  Purchase,
  ProductionBatch,
  FinancialTransaction,
  AuditLogEntry,
  Member,
  Invitation,
  OrganizationSettings,
  OrganizationSummary,
  DashboardOverview,
} from "./types";

export interface ListResult<T> {
  rows: T[];
  meta?: ApiMeta;
}

// ---------- Dashboard ----------
export const getDashboardOverview = () => api.get<DashboardOverview>("/dashboard/overview").then((r) => r.data);

// ---------- Departments ----------
export const listDepartments = () =>
  api.get<Department[]>("/departments", { pageSize: 100 }).then((r) => r.data);
export const createDepartment = (input: { name: string; description?: string }) =>
  api.post<Department>("/departments", input).then((r) => r.data);

// ---------- Employees ----------
export const listEmployees = (params?: { search?: string; status?: string }) =>
  api
    .get<Employee[]>("/employees", { pageSize: 100, ...params })
    .then((r): ListResult<Employee> => ({ rows: r.data, meta: r.meta }));
export const createEmployee = (input: Partial<Employee> & { firstName: string; lastName: string }) =>
  api.post<Employee>("/employees", input).then((r) => r.data);
export const updateEmployee = (id: string, input: Partial<Employee>) =>
  api.patch<Employee>(`/employees/${id}`, input).then((r) => r.data);
export const terminateEmployee = (id: string) => api.post(`/employees/${id}/terminate`);
export const reactivateEmployee = (id: string) => api.post(`/employees/${id}/reactivate`);
export const deleteEmployee = (id: string) => api.delete(`/employees/${id}`);

// ---------- Categories ----------
export const listCategories = () => api.get<ProductCategory[]>("/categories", { pageSize: 100 }).then((r) => r.data);
export const createCategory = (input: { name: string }) =>
  api.post<ProductCategory>("/categories", input).then((r) => r.data);

// ---------- Products ----------
export const listProducts = (params?: { search?: string; categoryId?: string }) =>
  api
    .get<Product[]>("/products", { pageSize: 100, ...params })
    .then((r): ListResult<Product> => ({ rows: r.data, meta: r.meta }));
export const createProduct = (input: {
  name: string;
  sku?: string;
  categoryId?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  openingQuantity?: number;
  reorderLevel?: number;
}) => api.post<Product>("/products", input).then((r) => r.data);
export const updateProduct = (id: string, input: Partial<Product>) =>
  api.patch<Product>(`/products/${id}`, input).then((r) => r.data);
export const deleteProduct = (id: string) => api.delete(`/products/${id}`);

// ---------- Inventory ----------
export const listInventory = (params?: { search?: string; lowStock?: boolean }) =>
  api
    .get<InventoryItem[]>("/inventory", { pageSize: 100, ...params })
    .then((r): ListResult<InventoryItem> => ({ rows: r.data, meta: r.meta }));
export const getInventorySummary = () =>
  api
    .get<{ inStock: number; lowStock: number; outOfStock: number; totalValue: number; totalProducts: number }>(
      "/inventory/summary"
    )
    .then((r) => r.data);
export const listInventoryMovements = (params?: { productId?: string }) =>
  api
    .get<InventoryMovement[]>("/inventory/movements", { pageSize: 50, ...params })
    .then((r): ListResult<InventoryMovement> => ({ rows: r.data, meta: r.meta }));
export const adjustInventory = (input: { productId: string; type: "ADJUSTMENT" | "RETURN"; quantity: number; note?: string }) =>
  api.post("/inventory/adjust", input);
export const transferInventory = (input: { productId: string; quantity: number; destination: string; note?: string }) =>
  api.post("/inventory/transfer", input);

// ---------- Suppliers ----------
export const listSuppliers = (params?: { search?: string }) =>
  api
    .get<Supplier[]>("/suppliers", { pageSize: 100, ...params })
    .then((r): ListResult<Supplier> => ({ rows: r.data, meta: r.meta }));
export const createSupplier = (input: { name: string; email?: string; phone?: string; address?: string }) =>
  api.post<Supplier>("/suppliers", input).then((r) => r.data);
export const updateSupplier = (id: string, input: Partial<Supplier>) =>
  api.patch<Supplier>(`/suppliers/${id}`, input).then((r) => r.data);
export const deleteSupplier = (id: string) => api.delete(`/suppliers/${id}`);

// ---------- Sales ----------
export const listSales = (params?: { search?: string; status?: string; paymentStatus?: string }) =>
  api
    .get<Sale[]>("/sales", { pageSize: 100, ...params })
    .then((r): ListResult<Sale> => ({ rows: r.data, meta: r.meta }));
export const getSalesSummary = () =>
  api
    .get<{ todaySales: number; weeklyRevenue: number; outstandingPayments: number; totalPaid: number }>("/sales/summary")
    .then((r) => r.data);
export const createSale = (input: {
  customerName?: string;
  customerPhone?: string;
  paymentStatus?: string;
  discount?: number;
  tax?: number;
  items: { productId: string; quantity: number; unitPrice?: number }[];
}) => api.post<Sale>("/sales", input).then((r) => r.data);
export const updateSale = (id: string, input: { status?: string; paymentStatus?: string }) =>
  api.patch<Sale>(`/sales/${id}`, input).then((r) => r.data);

// ---------- Purchases ----------
export const listPurchases = (params?: { search?: string; status?: string }) =>
  api
    .get<Purchase[]>("/purchases", { pageSize: 100, ...params })
    .then((r): ListResult<Purchase> => ({ rows: r.data, meta: r.meta }));
export const createPurchase = (input: {
  supplierId: string;
  paymentStatus?: string;
  items: { productId: string; quantity: number; unitCost: number }[];
}) => api.post<Purchase>("/purchases", input).then((r) => r.data);
export const receivePurchase = (id: string) => api.post<Purchase>(`/purchases/${id}/receive`).then((r) => r.data);
export const updatePurchase = (id: string, input: { status?: string; paymentStatus?: string }) =>
  api.patch<Purchase>(`/purchases/${id}`, input).then((r) => r.data);

// ---------- Production ----------
export const listProduction = () =>
  api.get<ProductionBatch[]>("/production", { pageSize: 100 }).then((r): ListResult<ProductionBatch> => ({ rows: r.data, meta: r.meta }));
export const createProductionBatch = (input: { productId: string; batchNumber?: string; quantity: number; notes?: string }) =>
  api.post<ProductionBatch>("/production", input).then((r) => r.data);
export const startProductionBatch = (id: string) => api.post(`/production/${id}/start`);
export const completeProductionBatch = (id: string) => api.post(`/production/${id}/complete`);
export const cancelProductionBatch = (id: string) => api.post(`/production/${id}/cancel`);

// ---------- Finance ----------
export const listFinanceTransactions = (params?: { type?: string }) =>
  api
    .get<FinancialTransaction[]>("/finance", { pageSize: 100, ...params })
    .then((r): ListResult<FinancialTransaction> => ({ rows: r.data, meta: r.meta }));
export const getFinanceSummary = () =>
  api.get<{ income: number; expense: number; net: number }>("/finance/summary").then((r) => r.data);
export const createFinanceTransaction = (input: {
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
  amount: number;
}) => api.post<FinancialTransaction>("/finance", input).then((r) => r.data);

// ---------- Audit logs ----------
export const listAuditLogs = () =>
  api.get<AuditLogEntry[]>("/audit-logs", { pageSize: 50 }).then((r): ListResult<AuditLogEntry> => ({ rows: r.data, meta: r.meta }));

// ---------- Organizations / members / settings ----------
export const listMyOrganizations = () => api.get<OrganizationSummary[]>("/organizations").then((r) => r.data);
export const getCurrentOrganization = () => api.get<OrganizationSummary>("/organizations/current").then((r) => r.data);
export const setActiveOrganization = (organizationId: string) =>
  api.post("/organizations/active", { organizationId });
export const updateCurrentOrganization = (input: { name?: string; logo?: string }) =>
  api.patch<OrganizationSummary>("/organizations/current", input).then((r) => r.data);

export const listMembers = () => api.get<Member[]>("/members").then((r) => r.data);
export const listInvitations = () => api.get<Invitation[]>("/members/invitations").then((r) => r.data);
export const updateMemberRole = (memberId: string, role: string) =>
  api.patch<Member>(`/members/${memberId}/role`, { role }).then((r) => r.data);
export const removeMember = (memberId: string) => api.delete(`/members/${memberId}`);

export const getOrganizationSettings = () => api.get<OrganizationSettings>("/settings").then((r) => r.data);
export const updateOrganizationSettings = (input: Partial<Pick<OrganizationSettings, "timezone" | "currency" | "dateFormat">>) =>
  api.patch<OrganizationSettings>("/settings", input).then((r) => r.data);
