"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { OrderStatus, StatusChange, orderRequiresApproval } from "@/lib/types";
import { formatPatientName } from "@/lib/utils";
import { DocumentButtons } from "@/components/documents/document-buttons";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  StickyNote,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Send,
  Package,
  Truck,
} from "lucide-react";

const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  Draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Approved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Ordered:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  Delivered: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
};

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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

function getNextStatus(current: OrderStatus): OrderStatus | null {
  const transitions: Record<OrderStatus, OrderStatus | null> = {
    Draft: "Submitted",
    Submitted: "Approved",
    Approved: "Ordered",
    Ordered: "Delivered",
    Delivered: null,
  };
  return transitions[current];
}

function getNextButtonLabel(current: OrderStatus, requiresApproval: boolean): string {
  switch (current) {
    case "Draft":
      return "Submit Order";
    case "Submitted":
      return requiresApproval ? "Approve Order" : "Mark as Approved";
    case "Approved":
      return "Mark as Ordered";
    case "Ordered":
      return "Mark as Delivered";
    default:
      return "";
  }
}

function getNextButtonIcon(current: OrderStatus) {
  switch (current) {
    case "Draft":
      return Send;
    case "Submitted":
      return ShieldCheck;
    case "Approved":
      return Package;
    case "Ordered":
      return Truck;
    default:
      return ArrowRight;
  }
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orders = useAppStore((s) => s.orders);
  const updateOrderStatus = useAppStore((s) => s.updateOrderStatus);

  const order = orders.find((o) => o.id === params.id);

  // Dialog state
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [actorName, setActorName] = useState("");
  const [comment, setComment] = useState("");

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

  const nextStatus = getNextStatus(order.status);
  const requiresApproval = orderRequiresApproval(order);
  const priorAuthItems = order.lineItems.filter((li) => li.requiresPriorAuth);
  const isApprovalTransition = order.status === "Submitted" && requiresApproval;

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

  function handleNextStepClick() {
    if (!nextStatus) return;
    setActorName("");
    setComment("");
    if (isApprovalTransition) {
      setShowApprovalDialog(true);
    } else {
      setShowStatusDialog(true);
    }
  }

  function handleStatusConfirm() {
    if (!order || !nextStatus || !actorName.trim()) return;
    const statusChange: StatusChange = {
      id: `sh-${Date.now()}`,
      fromStatus: order.status,
      toStatus: nextStatus,
      actorName: actorName.trim(),
      actorRole: "employee",
      comment: comment.trim(),
      timestamp: new Date().toISOString(),
    };
    updateOrderStatus(order.id, statusChange);
    setShowStatusDialog(false);
    setActorName("");
    setComment("");
  }

  function handleApprovalConfirm() {
    if (!order || !actorName.trim()) return;
    const statusChange: StatusChange = {
      id: `sh-${Date.now()}`,
      fromStatus: "Submitted",
      toStatus: "Approved",
      actorName: actorName.trim(),
      actorRole: "manager",
      comment: comment.trim(),
      timestamp: new Date().toISOString(),
    };
    updateOrderStatus(order.id, statusChange);
    setShowApprovalDialog(false);
    setActorName("");
    setComment("");
  }

  function handleRejection() {
    if (!order || !actorName.trim()) return;
    const statusChange: StatusChange = {
      id: `sh-${Date.now()}`,
      fromStatus: "Submitted",
      toStatus: "Submitted",
      actorName: actorName.trim(),
      actorRole: "manager",
      comment: comment.trim() ? `REJECTED: ${comment.trim()}` : "REJECTED",
      timestamp: new Date().toISOString(),
    };
    updateOrderStatus(order.id, statusChange);
    setShowApprovalDialog(false);
    setActorName("");
    setComment("");
  }

  const sortedHistory = [...(order.statusHistory || [])].reverse();

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
        {nextStatus && (
          <Button onClick={handleNextStepClick}>
            {(() => {
              const Icon = getNextButtonIcon(order.status);
              return <Icon className="mr-2 h-4 w-4" />;
            })()}
            {getNextButtonLabel(order.status, requiresApproval)}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: patient info + line items + documents + notes + activity */}
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
              <p className="text-sm text-muted-foreground mb-4">
                Generate and download order documents.
              </p>
              <DocumentButtons order={order} />
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

          {/* Order Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Order Activity
              </CardTitle>
              <CardDescription>
                Status change history for this order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No status changes recorded yet.
                </p>
              ) : (
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-6">
                    {sortedHistory.map((entry, idx) => (
                      <div key={entry.id} className="relative flex gap-4">
                        {/* Timeline dot */}
                        <div className="relative z-10 mt-1.5 flex-shrink-0">
                          <div
                            className={`h-[18px] w-[18px] rounded-full border-2 ${
                              idx === 0
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/30 bg-background"
                            }`}
                          >
                            {idx === 0 && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground m-px" />
                            )}
                          </div>
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {entry.fromStatus === entry.toStatus ? (
                              <Badge
                                className={STATUS_BADGE_CLASSES[entry.fromStatus]}
                                variant="secondary"
                              >
                                {entry.fromStatus}
                              </Badge>
                            ) : (
                              <>
                                <Badge
                                  className={STATUS_BADGE_CLASSES[entry.fromStatus]}
                                  variant="secondary"
                                >
                                  {entry.fromStatus}
                                </Badge>
                                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <Badge
                                  className={STATUS_BADGE_CLASSES[entry.toStatus]}
                                  variant="secondary"
                                >
                                  {entry.toStatus}
                                </Badge>
                              </>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-medium">{entry.actorName}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${
                                entry.actorRole === "manager"
                                  ? "border-blue-300 text-blue-600"
                                  : "border-gray-300 text-gray-500"
                              }`}
                            >
                              {entry.actorRole === "manager" ? "Manager" : "Employee"}
                            </Badge>
                            <span className="text-muted-foreground">
                              {formatDateTime(entry.timestamp)}
                            </span>
                          </div>
                          {entry.comment && (
                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                              {entry.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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

      {/* Standard Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Moving from{" "}
              <Badge
                className={`mx-1 ${STATUS_BADGE_CLASSES[order.status]}`}
                variant="secondary"
              >
                {order.status}
              </Badge>{" "}
              to{" "}
              {nextStatus && (
                <Badge
                  className={`mx-1 ${STATUS_BADGE_CLASSES[nextStatus]}`}
                  variant="secondary"
                >
                  {nextStatus}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="actor-name">Your Name</Label>
              <Input
                id="actor-name"
                placeholder="Enter your name"
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-comment">Comment (optional)</Label>
              <Textarea
                id="status-comment"
                placeholder="Add a note about this status change..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusConfirm}
              disabled={!actorName.trim()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog (for prior-auth orders) */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manager Approval Required</DialogTitle>
            <DialogDescription>
              Review and approve this order for processing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Prior auth warning */}
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    This order contains items requiring prior authorization:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {priorAuthItems.map((item) => (
                      <li key={item.id} className="text-sm text-amber-700 dark:text-amber-300">
                        {item.productName}{" "}
                        <code className="rounded bg-amber-100 px-1 py-0.5 text-xs dark:bg-amber-900">
                          {item.hcpcsCode}
                        </code>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager-name">Manager Name</Label>
              <Input
                id="manager-name"
                placeholder="Enter manager name"
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approval-notes">Approval Notes (optional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="e.g., Prior auth obtained, reference #12345"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
              onClick={handleRejection}
              disabled={!actorName.trim()}
            >
              Reject
            </Button>
            <Button
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={handleApprovalConfirm}
              disabled={!actorName.trim()}
            >
              Approve Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
