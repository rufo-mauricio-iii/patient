// Core data types for the Patient Order Management System

export interface Product {
  id: string;
  name: string;
  vendor: string;
  hcpcsCode: string;
  cost: number;
  msrp: number;
  category: string;
  requiresMeasurement: boolean;
  requiresPriorAuth: boolean;
}

export interface FeeSchedule {
  id: string;
  payer: string;
  hcpcsCode: string;
  state: string;
  reimbursementRate: number;
  multiplier: number;
}

export type OrderStatus = "Draft" | "Submitted" | "Approved" | "Ordered" | "Delivered";

export interface OrderLineItem {
  id: string;
  productId: string;
  productName: string;
  vendor: string;
  hcpcsCode: string;
  quantity: number;
  unitCost: number;
  billableAmount: number;
  patientResponsibility: number;
  margin: number;
  requiresMeasurement: boolean;
  requiresPriorAuth: boolean;
  measurementFile?: { name: string; size: number; type: string; dataUrl: string } | null;
}

export interface Order {
  id: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  // Patient info
  patientFirstName: string;
  patientMiddleName: string;
  patientLastName: string;
  patientSuffix: string;
  patientDob: string;
  patientAddress: string;
  shippingAddress: string;
  // Insurance
  insurancePayer: string;
  isSelfPay: boolean;
  // Line items
  lineItems: OrderLineItem[];
  // Financials (calculated)
  totalCost: number;
  totalBillable: number;
  totalPatientResponsibility: number;
  totalMargin: number;
  // Extras
  stripePaymentLink: string;
  notes: string;
  // Documents
  documents: GeneratedDocument[];
  // Status history
  statusHistory: StatusChange[];
}

export interface StatusChange {
  id: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  actorName: string;
  actorRole: "employee" | "manager";
  comment: string;
  timestamp: string;
}

export interface GeneratedDocument {
  id: string;
  orderId: string;
  type: "encounter_form" | "patient_invoice";
  generatedAt: string;
}

export function orderRequiresApproval(order: Order): boolean {
  return order.lineItems.some(li => li.requiresPriorAuth);
}
