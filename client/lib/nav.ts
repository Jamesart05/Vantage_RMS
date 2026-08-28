import type { NavItem } from "./types";

export const NAV_MAIN: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: "LayoutGrid" },
  { id: "employees", label: "Employees", href: "/employees", icon: "Users" },
  { id: "customers", label: "Customers", href: "/customers", icon: "UserCheck" },
  { id: "suppliers", label: "Suppliers", href: "/suppliers", icon: "Truck" },
  { id: "products", label: "Products", href: "/products", icon: "Package" },
  { id: "inventory", label: "Inventory", href: "/inventory", icon: "Box" },
  { id: "sales", label: "Sales", href: "/sales", icon: "TrendingUp" },
  { id: "purchases", label: "Purchases", href: "/purchases", icon: "ShoppingCart" },
  { id: "reports", label: "Reports", href: "/reports", icon: "BarChart2" },
  { id: "notifications", label: "Notifications", href: "/notifications", icon: "Bell" },
  { id: "ai-assistant", label: "AI Assistant", href: "/ai-assistant", icon: "Zap" },
  { id: "settings", label: "Settings", href: "/settings", icon: "Settings" },
];

export const NAV_FUTURE: NavItem[] = [
  { id: "manufacturing", label: "Manufacturing", href: "/future/manufacturing", icon: "Cpu" },
  { id: "finance", label: "Finance", href: "/future/finance", icon: "DollarSign" },
  { id: "logistics", label: "Logistics", href: "/future/logistics", icon: "Navigation" },
  { id: "crm", label: "CRM", href: "/future/crm", icon: "Heart" },
  { id: "maintenance", label: "Maintenance", href: "/future/maintenance", icon: "Wrench" },
  { id: "analytics", label: "Analytics", href: "/future/analytics", icon: "PieChart" },
  { id: "hr-advanced", label: "HR Advanced", href: "/future/hr-advanced", icon: "Briefcase" },
];

export const FUTURE_MODULE_META: Record<string, { title: string; desc: string }> = {
  manufacturing: { title: "Manufacturing", desc: "Production orders, bills of materials, batch tracking and quality control." },
  finance: { title: "Finance", desc: "General ledger, budgets, cash flow and multi-branch consolidation." },
  logistics: { title: "Logistics", desc: "Fleet, route planning, delivery tracking and warehousing." },
  crm: { title: "CRM", desc: "Pipelines, lead scoring and customer engagement campaigns." },
  maintenance: { title: "Maintenance", desc: "Asset tracking, preventive maintenance schedules and work orders." },
  analytics: { title: "Analytics", desc: "Cross-module business intelligence and custom dashboards." },
  "hr-advanced": { title: "HR Advanced", desc: "Payroll, appraisals, recruitment pipelines and shift scheduling." },
};

export const PAGE_META: Record<string, { title: string; desc: string }> = {
  dashboard: { title: "Dashboard", desc: "How is your business performing today?" },
  employees: { title: "Employees", desc: "Manage your team, roles and departments." },
  customers: { title: "Customers", desc: "Track relationships, balances and purchase history." },
  suppliers: { title: "Suppliers", desc: "Manage vendors, products supplied and payments." },
  products: { title: "Products", desc: "Your full catalog with pricing and stock levels." },
  inventory: { title: "Inventory", desc: "Stock levels, movements and adjustments." },
  sales: { title: "Sales", desc: "Invoices, quotations and payment tracking." },
  purchases: { title: "Purchases", desc: "Purchase requests, orders and goods received." },
  reports: { title: "Reports", desc: "Export insights across every module." },
  notifications: { title: "Notifications", desc: "Everything that needs your attention." },
  "ai-assistant": { title: "AI Assistant", desc: "Ask questions about your business in plain language." },
  settings: { title: "Settings", desc: "Company information, roles, users and preferences." },
};
