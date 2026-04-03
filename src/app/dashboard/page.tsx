"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { OrderStatus, orderRequiresApproval } from "@/lib/types";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  ClipboardList,
  Loader2,
  PackageCheck,
  MoreHorizontal,
  Search,
  ShieldAlert,
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

export default function DashboardPage() {
  const router = useRouter();
  const orders = useAppStore((s) => s.orders);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Summary counts
  const totalOrders = orders.length;
  const draftCount = orders.filter((o) => o.status === "Draft").length;
  const inProgressCount = orders.filter((o) =>
    ["Submitted", "Approved", "Ordered"].includes(o.status)
  ).length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;
  const awaitingApprovalCount = orders.filter(
    (o) => o.status === "Submitted" && orderRequiresApproval(o)
  ).length;

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        searchQuery === "" ||
        formatPatientName(order).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const summaryCards = [
    {
      label: "Total Orders",
      count: totalOrders,
      icon: FileText,
      color: "text-slate-600",
      subtitle: null as string | null,
    },
    {
      label: "Draft Orders",
      count: draftCount,
      icon: ClipboardList,
      color: "text-gray-500",
      subtitle: null as string | null,
    },
    {
      label: "In Progress",
      count: inProgressCount,
      icon: Loader2,
      color: "text-blue-600",
      subtitle: null as string | null,
    },
    {
      label: "Delivered",
      count: deliveredCount,
      icon: PackageCheck,
      color: "text-teal-600",
      subtitle: null as string | null,
    },
    {
      label: "Awaiting Approval",
      count: awaitingApprovalCount,
      icon: ShieldAlert,
      color: "text-amber-600",
      subtitle: "Requires prior auth",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Order Dashboard</h1>
        <p className="text-muted-foreground">
          Manage and track medical supply orders.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {card.label}
              </CardDescription>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.count}</div>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            A list of all patient orders and their current status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val ?? "All")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {ALL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Billable</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      <TableCell className="font-medium text-primary">
                        {order.id}
                      </TableCell>
                      <TableCell>{formatPatientName(order)}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={STATUS_BADGE_CLASSES[order.status]}
                          variant="secondary"
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(order.totalBillable)}
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/orders/${order.id}`)
                              }
                            >
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
