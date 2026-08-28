export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "TERMINATED" | "INVITED" | "ON_LEAVE";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
export type SaleStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "REFUNDED";
export type PurchaseStatus = "PENDING" | "RECEIVED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";
export type ProductionStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TransactionType = "INCOME" | "EXPENSE";
export type InventoryMovementType = "PURCHASE" | "SALE" | "PRODUCTION_IN" | "PRODUCTION_OUT" | "ADJUSTMENT" | "RETURN";

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  _count?: { employees: number };
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  employeeNumber?: string | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  position?: string | null;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  hireDate?: string | null;
  terminationDate?: string | null;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  _count?: { products: number };
}

export interface InventorySummaryRow {
  quantity: string | number;
  reorderLevel: string | number;
  price: string | number;
}

export interface Product {
  id: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  unit: string;
  costPrice: string | number;
  sellingPrice: string | number;
  isActive: boolean;
  inventory?: InventorySummaryRow[];
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  price: string | number;
  quantity: string | number;
  reorderLevel: string | number;
  product: { id: string; name: string; sku?: string | null; unit: string; sellingPrice: string | number };
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: InventoryMovementType;
  quantity: string | number;
  referenceId?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: PaymentStatus | null;
  _count?: { purchases: number };
}

export interface SaleItem {
  id: string;
  productId: string;
  quantity: string | number;
  unitPrice: string | number;
  subtotal: string | number;
  product?: { id: string; name: string; sku?: string | null };
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  status: SaleStatus;
  paymentStatus: PaymentStatus;
  subtotal: string | number;
  discount: string | number;
  tax: string | number;
  total: string | number;
  soldAt: string;
  items: SaleItem[];
}

export interface PurchaseItem {
  id: string;
  productId: string;
  quantity: string | number;
  unitCost: string | number;
  subtotal: string | number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplier?: { id: string; name: string };
  referenceNumber: string;
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  subtotal: string | number;
  total: string | number;
  purchasedAt: string;
  items: PurchaseItem[];
}

export interface ProductionBatch {
  id: string;
  productId: string;
  product?: { id: string; name: string; unit: string };
  batchNumber?: string | null;
  quantity: string | number;
  status: ProductionStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: string | number;
  referenceId?: string | null;
  referenceType?: string | null;
  transactionDate: string;
}

export interface AuditLogEntry {
  id: string;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: { id: string; name: string; email: string; image?: string | null };
}

export interface Invitation {
  id: string;
  email: string;
  role?: string | null;
  status: string;
  expiresAt: string;
}

export interface OrganizationSettings {
  id: string;
  organizationId: string;
  timezone: string;
  currency: string;
  dateFormat: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  role: string;
  metadata?: string | null;
}

export interface DashboardOverview {
  kpis: {
    todaySales: number;
    weeklyRevenue: number;
    inventoryValue: number;
    outstandingPayments: number;
    employeeCount: number;
    pendingPurchaseOrders: number;
  };
  lowStock: { count: number; items: InventoryItem[] };
  salesTrend: { date: string; total: number }[];
  topProducts: { name: string; revenue: number }[];
  recentSales: Sale[];
  recentActivity: AuditLogEntry[];
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
}
