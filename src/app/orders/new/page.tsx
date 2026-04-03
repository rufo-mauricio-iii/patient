"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import type { Order, OrderLineItem } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Trash2, Plus, AlertTriangle, Upload, FileText, X } from "lucide-react";

// ---- helpers ----

function currency(n: number): string {
  return `$${n.toFixed(2)}`;
}

function generateOrderId(): string {
  const num = Math.floor(Math.random() * 900) + 100;
  return `ORD-${num}`;
}

// ---- types for local state ----

interface MeasurementFileData {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

interface LineItemDraft {
  key: string; // local key for React list rendering
  productId: string;
  quantity: number;
  measurementFile?: MeasurementFileData | null;
}

const PAYERS = ["Medicare", "Blue Cross", "Aetna", "UnitedHealthcare"] as const;
const STATES = ["CA", "TX"] as const;

// ---- component ----

export default function NewOrderPage() {
  const router = useRouter();
  const { products, feeSchedules, addOrder } = useAppStore();

  // Patient info
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientMiddleName, setPatientMiddleName] = useState("");
  const [patientLastName, setPatientLastName] = useState("");
  const [patientSuffix, setPatientSuffix] = useState("");
  const [patientDob, setPatientDob] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [sameAsPatient, setSameAsPatient] = useState(true);
  const [insurancePayer, setInsurancePayer] = useState("");
  const [isSelfPay, setIsSelfPay] = useState(false);
  const [state, setState] = useState("");

  // Line items
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([]);

  // Extras
  const [stripePaymentLink, setStripePaymentLink] = useState("");
  const [notes, setNotes] = useState("");

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---- line item helpers ----

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), productId: "", quantity: 1 },
    ]);
  }, []);

  const removeLineItem = useCallback((key: string) => {
    setLineItems((prev) => prev.filter((li) => li.key !== key));
  }, []);

  const updateLineItem = useCallback(
    (key: string, field: keyof LineItemDraft, value: string | number) => {
      setLineItems((prev) =>
        prev.map((li) => (li.key === key ? { ...li, [field]: value } : li))
      );
    },
    []
  );

  // ---- measurement file helpers ----

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileSelect = useCallback(
    (key: string, file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        setFileErrors((prev) => ({ ...prev, [key]: "File exceeds 5MB limit" }));
        return;
      }
      setFileErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setLineItems((prev) =>
          prev.map((li) =>
            li.key === key
              ? {
                  ...li,
                  measurementFile: {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    dataUrl,
                  },
                }
              : li
          )
        );
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const removeMeasurementFile = useCallback((key: string) => {
    setLineItems((prev) =>
      prev.map((li) =>
        li.key === key ? { ...li, measurementFile: null } : li
      )
    );
    const input = fileInputRefs.current[key];
    if (input) input.value = "";
  }, []);

  // ---- computed line items with pricing ----

  const computedLineItems = useMemo(() => {
    return lineItems.map((li) => {
      const product = products.find((p) => p.id === li.productId);
      if (!product) {
        return {
          ...li,
          product: null,
          unitCost: 0,
          billableAmount: 0,
          patientResponsibility: 0,
          margin: 0,
          feeScheduleWarning: false,
        };
      }

      const unitCost = product.cost;
      let billableAmount = 0;
      let patientResponsibility = 0;
      let margin = 0;
      let feeScheduleWarning = false;

      if (isSelfPay) {
        billableAmount = product.msrp;
        patientResponsibility = product.msrp;
        margin = product.msrp - product.cost;
      } else if (insurancePayer && state) {
        const fee = feeSchedules.find(
          (f) =>
            f.payer === insurancePayer &&
            f.hcpcsCode === product.hcpcsCode &&
            f.state === state
        );
        if (fee) {
          billableAmount = fee.reimbursementRate * fee.multiplier;
          patientResponsibility = billableAmount * 0.2;
          margin = billableAmount - product.cost;
        } else {
          feeScheduleWarning = true;
        }
      }

      return {
        ...li,
        product,
        unitCost,
        billableAmount,
        patientResponsibility,
        margin,
        feeScheduleWarning,
      };
    });
  }, [lineItems, products, feeSchedules, isSelfPay, insurancePayer, state]);

  // ---- billing summary ----

  const summary = useMemo(() => {
    let totalCost = 0;
    let totalBillable = 0;
    let totalPatientResp = 0;
    let totalMargin = 0;

    for (const li of computedLineItems) {
      totalCost += li.unitCost * li.quantity;
      totalBillable += li.billableAmount * li.quantity;
      totalPatientResp += li.patientResponsibility * li.quantity;
      totalMargin += li.margin * li.quantity;
    }

    return { totalCost, totalBillable, totalPatientResp, totalMargin };
  }, [computedLineItems]);

  // ---- validation and save ----

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!patientFirstName.trim()) newErrors.patientFirstName = "First name is required";
    if (!patientLastName.trim()) newErrors.patientLastName = "Last name is required";
    if (!patientDob) newErrors.patientDob = "Date of birth is required";
    if (!patientAddress.trim())
      newErrors.patientAddress = "Patient address is required";
    if (lineItems.length === 0)
      newErrors.lineItems = "At least one line item is required";
    else {
      for (const li of lineItems) {
        if (!li.productId) {
          newErrors.lineItems = "All line items must have a product selected";
          break;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSaveAsDraft() {
    if (!validate()) return;

    const resolvedShipping = sameAsPatient ? patientAddress : shippingAddress;
    const now = new Date().toISOString();
    const orderId = generateOrderId();

    const orderLineItems: OrderLineItem[] = computedLineItems
      .filter((li) => li.product)
      .map((li) => ({
        id: crypto.randomUUID(),
        productId: li.productId,
        productName: li.product!.name,
        vendor: li.product!.vendor,
        hcpcsCode: li.product!.hcpcsCode,
        quantity: li.quantity,
        unitCost: li.unitCost,
        billableAmount: li.billableAmount,
        patientResponsibility: li.patientResponsibility,
        margin: li.margin,
        requiresMeasurement: li.product!.requiresMeasurement,
        requiresPriorAuth: li.product!.requiresPriorAuth,
        measurementFile: li.measurementFile ?? null,
      }));

    const order: Order = {
      id: orderId,
      status: "Draft",
      createdAt: now,
      updatedAt: now,
      patientFirstName: patientFirstName.trim(),
      patientMiddleName: patientMiddleName.trim(),
      patientLastName: patientLastName.trim(),
      patientSuffix: patientSuffix.trim(),
      patientDob,
      patientAddress: patientAddress.trim(),
      shippingAddress: resolvedShipping.trim(),
      insurancePayer: isSelfPay ? "" : insurancePayer,
      isSelfPay,
      lineItems: orderLineItems,
      totalCost: summary.totalCost,
      totalBillable: summary.totalBillable,
      totalPatientResponsibility: summary.totalPatientResp,
      totalMargin: summary.totalMargin,
      stripePaymentLink: stripePaymentLink.trim(),
      notes: notes.trim(),
      documents: [],
      statusHistory: [],
    };

    addOrder(order);
    router.push(`/orders/${orderId}`);
  }

  // ---- render ----

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New Order
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new medical supply order for a patient.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
        {/* Left column */}
        <div className="space-y-6">
          {/* ======== Patient Info ======== */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>
                Enter the patient&apos;s personal and insurance details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Row 1: Name fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientFirstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="patientFirstName"
                    placeholder="First name"
                    value={patientFirstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPatientFirstName(e.target.value)
                    }
                  />
                  {errors.patientFirstName && (
                    <p className="text-xs text-destructive">{errors.patientFirstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientMiddleName">Middle Name</Label>
                  <Input
                    id="patientMiddleName"
                    placeholder="Middle name"
                    value={patientMiddleName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPatientMiddleName(e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientLastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="patientLastName"
                    placeholder="Last name"
                    value={patientLastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPatientLastName(e.target.value)
                    }
                  />
                  {errors.patientLastName && (
                    <p className="text-xs text-destructive">{errors.patientLastName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientSuffix">Suffix</Label>
                  <Input
                    id="patientSuffix"
                    placeholder="Jr., III, etc."
                    value={patientSuffix}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPatientSuffix(e.target.value)
                    }
                  />
                </div>
              </div>
              {/* Row 2: DOB */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientDob">
                    Date of Birth <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="patientDob"
                    type="date"
                    value={patientDob}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPatientDob(e.target.value)
                    }
                  />
                  {errors.patientDob && (
                    <p className="text-xs text-destructive">{errors.patientDob}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Patient Address */}
              <div className="space-y-2">
                <Label htmlFor="patientAddress">
                  Patient Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="patientAddress"
                  placeholder="Street, City, State ZIP"
                  value={patientAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPatientAddress(e.target.value)
                  }
                />
                {errors.patientAddress && (
                  <p className="text-xs text-destructive">
                    {errors.patientAddress}
                  </p>
                )}
              </div>

              {/* Row 3: Shipping Address */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={sameAsPatient}
                    onCheckedChange={(checked: boolean) => {
                      setSameAsPatient(checked);
                      if (checked) setShippingAddress("");
                    }}
                  />
                  <Label className="text-sm font-normal cursor-pointer">
                    Shipping address same as patient address
                  </Label>
                </div>
                {!sameAsPatient && (
                  <Input
                    placeholder="Shipping address"
                    value={shippingAddress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setShippingAddress(e.target.value)
                    }
                  />
                )}
              </div>

              <Separator />

              {/* Row 4: Insurance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Insurance Payer</Label>
                  <Select
                    value={isSelfPay ? "" : insurancePayer}
                    onValueChange={(val) => setInsurancePayer(val ?? "")}
                    disabled={isSelfPay}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payer" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYERS.map((payer) => (
                        <SelectItem key={payer} value={payer}>
                          {payer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  <Select
                    value={state}
                    onValueChange={(val) => setState(val ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end pb-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isSelfPay}
                      onCheckedChange={(checked: boolean) => {
                        setIsSelfPay(checked);
                        if (checked) setInsurancePayer("");
                      }}
                    />
                    <Label className="text-sm font-normal cursor-pointer">
                      Self-pay
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ======== Product Selection ======== */}
          <Card>
            <CardHeader>
              <CardTitle>Product Selection</CardTitle>
              <CardDescription>
                Add products to this order. Pricing is calculated automatically based
                on payer and state.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.lineItems && (
                <p className="text-sm text-destructive">{errors.lineItems}</p>
              )}

              {computedLineItems.map((li, idx) => (
                <div
                  key={li.key}
                  className="rounded-lg border p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Line Item {idx + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(li.key)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {/* Product + Quantity */}
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-4">
                    <div className="space-y-2">
                      <Label>Product</Label>
                      <Select
                        value={li.productId}
                        onValueChange={(val) =>
                          updateLineItem(li.key, "productId", val ?? "")
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        value={li.quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateLineItem(
                            li.key,
                            "quantity",
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Product details (shown when product selected) */}
                  {li.product && (
                    <>
                      {/* Read-only info row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Vendor</span>
                          <p className="font-medium">{li.product.vendor}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">HCPCS Code</span>
                          <p className="font-medium">{li.product.hcpcsCode}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Unit Cost</span>
                          <p className="font-medium">{currency(li.unitCost)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">MSRP</span>
                          <p className="font-medium">
                            {currency(li.product.msrp)}
                          </p>
                        </div>
                      </div>

                      {/* Calculated pricing row */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Billable Amount
                          </span>
                          <p className="font-medium">
                            {currency(li.billableAmount)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Patient Responsibility
                          </span>
                          <p className="font-medium">
                            {currency(li.patientResponsibility)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Margin</span>
                          <p className="font-medium">{currency(li.margin)}</p>
                        </div>
                      </div>

                      {/* Badges + warnings */}
                      <div className="flex flex-wrap items-center gap-2">
                        {li.product.requiresMeasurement && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            Measurement Required
                          </Badge>
                        )}
                        {li.product.requiresPriorAuth && (
                          <Badge variant="destructive">Prior Auth Required</Badge>
                        )}
                        {li.feeScheduleWarning && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            No fee schedule found for this combination
                          </span>
                        )}
                      </div>

                      {/* Measurement file upload */}
                      {li.product.requiresMeasurement && (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            ref={(el) => {
                              fileInputRefs.current[li.key] = el;
                            }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileSelect(li.key, file);
                            }}
                          />
                          {li.measurementFile ? (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{li.measurementFile.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => removeMeasurementFile(li.key)}
                              >
                                <X className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRefs.current[li.key]?.click()}
                              >
                                <Upload className="mr-2 h-3.5 w-3.5" />
                                Upload Measurement Form
                              </Button>
                              <p className="text-xs text-amber-600">
                                Measurement form required — upload before submitting
                              </p>
                            </>
                          )}
                          {fileErrors[li.key] && (
                            <p className="text-xs text-destructive">{fileErrors[li.key]}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              <Button variant="outline" onClick={addLineItem} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Line Item
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column - sticky sidebar */}
        <div className="lg:sticky lg:top-8 space-y-6">
          {/* ======== Billing Summary ======== */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Cost</span>
                  <span className="text-sm font-semibold">
                    {currency(summary.totalCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Billable</span>
                  <span className="text-sm font-semibold">
                    {currency(summary.totalBillable)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Patient Responsibility</span>
                  <span className="text-sm font-semibold">
                    {currency(summary.totalPatientResp)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Margin</span>
                <span className="text-xl font-bold text-green-600">
                  {currency(summary.totalMargin)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* ======== Additional Information ======== */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripeLink">
                  Paste your Stripe payment link here
                </Label>
                <Input
                  id="stripeLink"
                  placeholder="https://buy.stripe.com/..."
                  value={stripePaymentLink}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setStripePaymentLink(e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about this order..."
                  rows={3}
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNotes(e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* ======== Actions ======== */}
          <div className="flex flex-col gap-3 pb-8">
            <Button onClick={handleSaveAsDraft} className="w-full">
              Save as Draft
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/orders")}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
