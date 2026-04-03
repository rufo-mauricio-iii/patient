"use client";

import { create } from "zustand";
import { Product, FeeSchedule, Order, OrderStatus, StatusChange } from "@/lib/types";
import { seedProducts, seedFeeSchedules, seedOrders } from "@/data/seed";

interface AppStore {
  // Products
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Fee Schedules
  feeSchedules: FeeSchedule[];
  addFeeSchedule: (fee: FeeSchedule) => void;
  updateFeeSchedule: (id: string, fee: Partial<FeeSchedule>) => void;
  deleteFeeSchedule: (id: string) => void;

  // Orders
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  updateOrderStatus: (id: string, statusChange: StatusChange) => void;

  // Lookup helpers
  getProduct: (id: string) => Product | undefined;
  getFeeSchedule: (payer: string, hcpcsCode: string, state: string) => FeeSchedule | undefined;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Products
  products: seedProducts,
  addProduct: (product) =>
    set((state) => ({ products: [...state.products, product] })),
  updateProduct: (id, updates) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deleteProduct: (id) =>
    set((state) => ({ products: state.products.filter((p) => p.id !== id) })),

  // Fee Schedules
  feeSchedules: seedFeeSchedules,
  addFeeSchedule: (fee) =>
    set((state) => ({ feeSchedules: [...state.feeSchedules, fee] })),
  updateFeeSchedule: (id, updates) =>
    set((state) => ({
      feeSchedules: state.feeSchedules.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),
  deleteFeeSchedule: (id) =>
    set((state) => ({ feeSchedules: state.feeSchedules.filter((f) => f.id !== id) })),

  // Orders
  orders: seedOrders,
  addOrder: (order) =>
    set((state) => ({ orders: [order, ...state.orders] })),
  updateOrder: (id, updates) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    })),
  updateOrderStatus: (id, statusChange) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id
          ? {
              ...o,
              status: statusChange.toStatus,
              updatedAt: new Date().toISOString(),
              statusHistory: [...o.statusHistory, statusChange],
            }
          : o
      ),
    })),

  // Lookup helpers
  getProduct: (id) => get().products.find((p) => p.id === id),
  getFeeSchedule: (payer, hcpcsCode, state) =>
    get().feeSchedules.find(
      (f) => f.payer === payer && f.hcpcsCode === hcpcsCode && f.state === state
    ),
}));
