import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Order } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPatientName(order: Order): string {
  const parts = [
    order.patientFirstName,
    order.patientMiddleName,
    order.patientLastName,
    order.patientSuffix,
  ].filter(Boolean);
  return parts.join(" ");
}
