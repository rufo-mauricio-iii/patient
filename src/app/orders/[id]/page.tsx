"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { OrderStatus } from "@/lib/types";
import { formatPatientName } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  StickyNote,
  AlertTriangle,
} from "lucide-react";

const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  Draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Approved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Ordered:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  Delivered: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
};

const ALL_STATUSES: OrderStatus[] = [
  "Draft",
  "Submitted",
  "Approved",
  "Ordered",
  "Delivered",
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDob(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function docTypeLabel(type: string): string {
  switch (type) {
    case "encounter_form":
      return "Encounter Form";
    case "patient_invoice":
      return "Patient Invoice";
    default:
      return type;
  }
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orders = useAppStore((s) => s.orders);
  const updateOrderStatus = useAppStore((s) => s.updateOrderStatus);

  const order = orders.find((o) => o.id === params.id);

  if (!order) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Order not found</h2>
        <p className="text-muted-foreground">
          No order exists with ID &quot;{params.id}&quot;.
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Computed totals from line items
  const totals = order.lineItems.reduce(
    (acc, item) => ({
      cost: acc.cost + item.unitCost * item.quantity,
      billable: acc.billable + item.billableAmount * item.quantity,
      patientResp:
        acc.patientResp + item.patientResponsibility * item.quantity,
      margin: acc.margin + item.margin * item.quantity,
    }),
    { cost: 0, billable: 0, patientResp: 0, margin: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{order.id}</h1>
            <Badge
              className={STATUS_BADGE_CLASSES[order.status]}
              variant="secondary"
            >
              {order.status}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Update Status
            <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ALL_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => updateOrderStatus(order.id, status)}
                disabled={order.status === status}
              >
                <Badge
                  className={`mr-2 ${STATUS_BADGE_CLASSES[status]}`}
                  variant="secondary"
                >
                  {status}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: patient info + line items + documents + notes */}
        <div className="space-y-6 lg:col-span-2">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Patient Name</p>
                  <p className="font-medium">{formatPatientName(order)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{formatDob(order.patientDob)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{order.patientAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Shipping Address
                  </p>
                  <p className="font-medium">{order.shippingAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Insurance Payer
                  </p>
                  <p className="font-medium">
                    {order.isSelfPay ? (
                      <Badge
                        variant="outline"
                        className="border-amber-300 text-amber-600"
                      >
                        Self-Pay
                      </Badge>
                    ) : (
                      order.insurancePayer
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Last Updated
                  </p>
                  <p className="font-medium">{formatDate(order.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>
                Products included in this order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>HCPCS</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Billable</TableHead>
                      <TableHead className="text-right">
                        Patient Resp.
                      </TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead>Flags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.productName}
                        </TableCell>
                        <TableCell>{item.vendor}</TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {item.hcpcsCode}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitCost)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.billableAmount * item.quantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            item.patientResponsibility * item.quantity
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.margin * item.quantity)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.requiresMeasurement && (
                              <Badge
                                variant="outline"
                                className="border-purple-300 text-purple-600 text-[10px]"
                              >
                                Measurement
                              </Badge>
                            )}
                            {item.requiresPriorAuth && (
                              <Badge
                                variant="outline"
                                className="border-red-300 text-red-600 text-[10px]"
                              >
                                Prior Auth
                              </Badge>
                            )}
                            {item.measurementFile ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                                onClick={() => {
                                  window.open(item.measurementFile!.dataUrl, "_blank");
                                }}
                              >
                                <FileText className="mr-1 h-3 w-3" />
                                View Measurement Form
                              </Button>
                            ) : item.requiresMeasurement ? (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-[10px]">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Measurement Pending
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="font-semibold">
                        Totals
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(totals.cost)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(totals.billable)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(totals.patientResp)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(totals.margin)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Generated documents for this order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {order.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No documents have been generated yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {order.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {docTypeLabel(doc.type)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Generated on {formatDate(doc.generatedAt)}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Separator className="my-4" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-3 w-3" />
                  Download Encounter Form
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-3 w-3" />
                  Download Invoice
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Billing Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Cost
                </span>
                <span className="font-medium">
                  {formatCurrency(order.totalCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Billable
                </span>
                <span className="font-medium">
                  {formatCurrency(order.totalBillable)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Patient Responsibility
                </span>
                <span className="font-medium">
                  {formatCurrency(order.totalPatientResponsibility)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Margin
                </span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(order.totalMargin)}
                </span>
              </div>
              {order.stripePaymentLink && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Stripe Payment Link
                    </p>
                    <a
                      href={order.stripePaymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open Payment Link
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Timeline Info */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-medium">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(order.updatedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  className={`mt-1 ${STATUS_BADGE_CLASSES[order.status]}`}
                  variant="secondary"
                >
                  {order.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
