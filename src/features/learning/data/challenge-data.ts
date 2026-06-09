import type { SchemaTable } from "../../../shared/types/sql-arena";

export type ChallengeRow = Record<string, string | number | boolean | null>;

export const challengeSchema: SchemaTable[] = [
  {
    name: "customers",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "full_name", type: "text" },
      { name: "email", type: "text" },
      { name: "city", type: "text" },
      { name: "state", type: "text" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    name: "categories",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "name", type: "text" },
    ],
  },
  {
    name: "products",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "category_id", type: "uuid" },
      { name: "name", type: "text" },
      { name: "sku", type: "text" },
      { name: "price", type: "numeric" },
      { name: "cost", type: "numeric" },
      { name: "active", type: "boolean" },
      { name: "stock_quantity", type: "integer" },
    ],
  },
  {
    name: "orders",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "customer_id", type: "uuid" },
      { name: "order_number", type: "text" },
      { name: "status", type: "text" },
      { name: "order_date", type: "timestamp" },
      { name: "total_amount", type: "numeric" },
      { name: "shipping_amount", type: "numeric" },
      { name: "discount_amount", type: "numeric" },
    ],
  },
  {
    name: "order_items",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "order_id", type: "uuid" },
      { name: "product_id", type: "uuid" },
      { name: "quantity", type: "integer" },
      { name: "unit_price", type: "numeric" },
      { name: "line_total", type: "numeric" },
    ],
  },
  {
    name: "payments",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "order_id", type: "uuid" },
      { name: "payment_method", type: "text" },
      { name: "status", type: "text" },
      { name: "amount", type: "numeric" },
      { name: "paid_at", type: "timestamp" },
    ],
  },
  {
    name: "shipments",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "order_id", type: "uuid" },
      { name: "carrier", type: "text" },
      { name: "status", type: "text" },
      { name: "shipped_at", type: "timestamp" },
      { name: "delivered_at", type: "timestamp" },
    ],
  },
  {
    name: "financial_transactions",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "order_id", type: "uuid" },
      { name: "type", type: "text" },
      { name: "amount", type: "numeric" },
      { name: "transaction_date", type: "date" },
    ],
  },
];

export const challengeData: Record<string, ChallengeRow[]> = {
  customers: [
    { id: "cus-001", full_name: "Alice Silva", email: "alice@exemplo.com", city: "Porto Velho", state: "Rondonia", created_at: "2026-01-05T10:00:00" },
    { id: "cus-002", full_name: "Beto Souza", email: "beto@exemplo.com", city: "Ariquemes", state: "Rondonia", created_at: "2026-01-07T10:00:00" },
    { id: "cus-003", full_name: "Carla Mendes", email: "carla@exemplo.com", city: "Ji-Parana", state: "Rondonia", created_at: "2026-01-09T10:00:00" },
    { id: "cus-004", full_name: "Daniel Lima", email: "daniel@exemplo.com", city: "Vilhena", state: "Rondonia", created_at: "2026-01-11T10:00:00" },
    { id: "cus-005", full_name: "Helena Costa", email: "helena@exemplo.com", city: "Sao Paulo", state: "SP", created_at: "2026-01-13T10:00:00" },
    { id: "cus-006", full_name: "Joao Pedro", email: "joao@exemplo.com", city: "Rio de Janeiro", state: "RJ", created_at: "2026-01-15T10:00:00" },
    { id: "cus-007", full_name: "Marina Alves", email: "marina@exemplo.com", city: "Campinas", state: "SP", created_at: "2026-01-17T10:00:00" },
    { id: "cus-008", full_name: "Rafael Nunes", email: "rafael@exemplo.com", city: "Niteroi", state: "RJ", created_at: "2026-01-19T10:00:00" },
  ],
  categories: [
    { id: "cat-001", name: "Informatica" },
    { id: "cat-002", name: "Casa" },
    { id: "cat-003", name: "Livros" },
  ],
  products: [
    { id: "prd-001", category_id: "cat-001", name: "Notebook Pro 14", sku: "NB-PRO-14", price: 5200, cost: 3900, active: true, stock_quantity: 8 },
    { id: "prd-002", category_id: "cat-001", name: "Monitor 27", sku: "MON-27", price: 1400, cost: 900, active: true, stock_quantity: 0 },
    { id: "prd-003", category_id: "cat-001", name: "Teclado Mecanico", sku: "KEY-MEC", price: 420, cost: 230, active: true, stock_quantity: 0 },
    { id: "prd-004", category_id: "cat-002", name: "Cafeteira Smart", sku: "CAF-SM", price: 650, cost: 350, active: true, stock_quantity: 5 },
    { id: "prd-005", category_id: "cat-003", name: "SQL na Pratica", sku: "BOOK-SQL", price: 120, cost: 45, active: true, stock_quantity: 18 },
  ],
  orders: [
    { id: "ord-001", customer_id: "cus-005", order_number: "A1001", status: "paid", order_date: "2026-02-01T11:20:00", total_amount: 5620, shipping_amount: 40, discount_amount: 0 },
    { id: "ord-002", customer_id: "cus-006", order_number: "A1002", status: "delivered", order_date: "2026-02-02T09:10:00", total_amount: 1520, shipping_amount: 35, discount_amount: 20 },
    { id: "ord-003", customer_id: "cus-001", order_number: "A1003", status: "cancelled", order_date: "2026-02-03T16:45:00", total_amount: 420, shipping_amount: 25, discount_amount: 0 },
  ],
  order_items: [
    { id: "itm-001", order_id: "ord-001", product_id: "prd-001", quantity: 1, unit_price: 5200, line_total: 5200 },
    { id: "itm-002", order_id: "ord-001", product_id: "prd-003", quantity: 1, unit_price: 420, line_total: 420 },
    { id: "itm-003", order_id: "ord-002", product_id: "prd-002", quantity: 1, unit_price: 1400, line_total: 1400 },
  ],
  payments: [
    { id: "pay-001", order_id: "ord-001", payment_method: "pix", status: "paid", amount: 5620, paid_at: "2026-02-01T11:25:00" },
    { id: "pay-002", order_id: "ord-002", payment_method: "credit_card", status: "paid", amount: 1520, paid_at: "2026-02-02T09:12:00" },
  ],
  shipments: [
    { id: "shp-001", order_id: "ord-002", carrier: "Rapido Norte", status: "delivered", shipped_at: "2026-02-03T10:00:00", delivered_at: "2026-02-05T15:30:00" },
  ],
  financial_transactions: [
    { id: "fin-001", order_id: "ord-001", type: "revenue", amount: 5620, transaction_date: "2026-02-01" },
    { id: "fin-002", order_id: "ord-002", type: "revenue", amount: 1520, transaction_date: "2026-02-02" },
    { id: "fin-003", order_id: "ord-003", type: "refund", amount: 420, transaction_date: "2026-02-03" },
  ],
};
