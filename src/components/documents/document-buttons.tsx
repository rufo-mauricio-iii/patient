"use client";

import { FileText, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateEncounterForm, generatePatientInvoice } from "@/lib/documents";
import { openPrintableDocument } from "@/lib/generate-pdf";
import type { Order } from "@/lib/types";

interface DocumentButtonsProps {
  order: Order;
}

export function DocumentButtons({ order }: DocumentButtonsProps) {
  function handleEncounterForm() {
    const html = generateEncounterForm(order);
    openPrintableDocument(html, `Encounter Form - ${order.id}`);
  }

  function handlePatientInvoice() {
    const html = generatePatientInvoice(order);
    openPrintableDocument(html, `Patient Invoice - ${order.id}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleEncounterForm}>
        <FileText className="size-4" data-icon="inline-start" />
        Download Encounter Form
      </Button>
      <Button variant="outline" size="sm" onClick={handlePatientInvoice}>
        <Receipt className="size-4" data-icon="inline-start" />
        Download Patient Invoice
      </Button>
    </div>
  );
}
