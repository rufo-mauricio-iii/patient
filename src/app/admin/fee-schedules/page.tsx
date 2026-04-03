"use client";

import { useState, useRef } from "react";
import { useAppStore } from "@/lib/store";
import type { FeeSchedule } from "@/lib/types";
import {
  generateFeeScheduleTemplate,
  parseFeeScheduleCSV,
  downloadCSV,
} from "@/lib/csv-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlusIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  DownloadIcon,
  UploadIcon,
} from "lucide-react";
import { toast } from "sonner";

const PAYERS = ["Medicare", "Blue Cross", "Aetna", "UnitedHealthcare"] as const;
const STATES = ["CA", "TX"] as const;

function generateFeeId(): string {
  return `fee-${String(Math.floor(Math.random() * 900) + 100)}`;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

interface FeeFormState {
  payer: string;
  hcpcsCode: string;
  state: string;
  reimbursementRate: string;
  multiplier: string;
}

const emptyForm: FeeFormState = {
  payer: "",
  hcpcsCode: "",
  state: "",
  reimbursementRate: "",
  multiplier: "1.0",
};

function feeToForm(fee: FeeSchedule): FeeFormState {
  return {
    payer: fee.payer,
    hcpcsCode: fee.hcpcsCode,
    state: fee.state,
    reimbursementRate: String(fee.reimbursementRate),
    multiplier: String(fee.multiplier),
  };
}

interface CSVParseResult {
  valid: FeeSchedule[];
  errors: { row: number; message: string }[];
}

export default function FeeSchedulesPage() {
  const feeSchedules = useAppStore((s) => s.feeSchedules);
  const addFeeSchedule = useAppStore((s) => s.addFeeSchedule);
  const updateFeeSchedule = useAppStore((s) => s.updateFeeSchedule);
  const deleteFeeSchedule = useAppStore((s) => s.deleteFeeSchedule);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeSchedule | null>(null);
  const [deletingFee, setDeletingFee] = useState<FeeSchedule | null>(null);
  const [form, setForm] = useState<FeeFormState>(emptyForm);
  const [csvResult, setCsvResult] = useState<CSVParseResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function openAddDialog() {
    setEditingFee(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(fee: FeeSchedule) {
    setEditingFee(fee);
    setForm(feeToForm(fee));
    setDialogOpen(true);
  }

  function openDeleteDialog(fee: FeeSchedule) {
    setDeletingFee(fee);
    setDeleteDialogOpen(true);
  }

  function handleSave() {
    const reimbursementRate = parseFloat(form.reimbursementRate);
    const multiplier = parseFloat(form.multiplier);

    if (
      !form.payer ||
      !form.hcpcsCode ||
      !form.state ||
      isNaN(reimbursementRate) ||
      isNaN(multiplier)
    ) {
      return;
    }

    if (editingFee) {
      updateFeeSchedule(editingFee.id, {
        payer: form.payer,
        hcpcsCode: form.hcpcsCode,
        state: form.state,
        reimbursementRate,
        multiplier,
      });
    } else {
      addFeeSchedule({
        id: generateFeeId(),
        payer: form.payer,
        hcpcsCode: form.hcpcsCode,
        state: form.state,
        reimbursementRate,
        multiplier,
      });
    }

    setDialogOpen(false);
    setEditingFee(null);
    setForm(emptyForm);
  }

  function handleDelete() {
    if (deletingFee) {
      deleteFeeSchedule(deletingFee.id);
      setDeleteDialogOpen(false);
      setDeletingFee(null);
    }
  }

  function handleDownloadTemplate() {
    const template = generateFeeScheduleTemplate();
    downloadCSV(template, "fee-schedule-template.csv");
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      const result = parseFeeScheduleCSV(csvText);
      setCsvResult(result);
      setCsvDialogOpen(true);
    };
    reader.readAsText(file);

    // Reset file input so the same file can be re-uploaded
    e.target.value = "";
  }

  function handleImport() {
    if (!csvResult) return;

    for (const fee of csvResult.valid) {
      addFeeSchedule(fee);
    }

    const count = csvResult.valid.length;
    toast.success(
      `Successfully imported ${count} fee schedule${count !== 1 ? "s" : ""}`
    );

    setCsvDialogOpen(false);
    setCsvResult(null);
  }

  function handleCsvDialogClose() {
    setCsvDialogOpen(false);
    setCsvResult(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Schedules</h1>
          <p className="text-muted-foreground">
            Manage payer reimbursement rates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <DownloadIcon data-icon="inline-start" />
            Download Template
          </Button>
          <Button variant="outline" onClick={handleUploadClick}>
            <UploadIcon data-icon="inline-start" />
            Upload CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button onClick={openAddDialog}>
                  <PlusIcon data-icon="inline-start" />
                  Add Fee Schedule
                </Button>
              }
            />
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingFee ? "Edit Fee Schedule" : "Add Fee Schedule"}
                </DialogTitle>
                <DialogDescription>
                  {editingFee
                    ? "Update the fee schedule details below."
                    : "Fill in the details to add a new fee schedule entry."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Payer *</Label>
                    <Select
                      value={form.payer}
                      onValueChange={(val) =>
                        setForm({ ...form, payer: val ?? "" })
                      }
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
                  <div className="grid gap-2">
                    <Label>State *</Label>
                    <Select
                      value={form.state}
                      onValueChange={(val) =>
                        setForm({ ...form, state: val ?? "" })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fee-hcpcs">HCPCS Code *</Label>
                  <Input
                    id="fee-hcpcs"
                    value={form.hcpcsCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, hcpcsCode: e.target.value })
                    }
                    placeholder="e.g., A6530"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fee-rate">Reimbursement Rate ($) *</Label>
                    <Input
                      id="fee-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.reimbursementRate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForm({ ...form, reimbursementRate: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fee-multiplier">Multiplier *</Label>
                    <Input
                      id="fee-multiplier"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.multiplier}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForm({ ...form, multiplier: e.target.value })
                      }
                      placeholder="1.0"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button onClick={handleSave}>
                  {editingFee ? "Update Fee Schedule" : "Add Fee Schedule"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Fee Schedules</CardTitle>
          <CardDescription>
            {feeSchedules.length}{" "}
            {feeSchedules.length === 1 ? "entry" : "entries"} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payer</TableHead>
                <TableHead>HCPCS Code</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Reimbursement Rate</TableHead>
                <TableHead className="text-right">Multiplier</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No fee schedules found. Add your first entry to get started.
                  </TableCell>
                </TableRow>
              ) : (
                feeSchedules.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">{fee.payer}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {fee.hcpcsCode}
                    </TableCell>
                    <TableCell>{fee.state}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(fee.reimbursementRate)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {fee.multiplier.toFixed(2)}x
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontalIcon />
                              <span className="sr-only">Actions</span>
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(fee)}
                          >
                            <PencilIcon />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(fee)}
                            className="text-destructive focus:text-destructive"
                          >
                            <TrashIcon />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Fee Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the fee schedule for{" "}
              <span className="font-medium text-foreground">
                {deletingFee?.payer} / {deletingFee?.hcpcsCode} / {deletingFee?.state}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Upload Preview Dialog */}
      <Dialog open={csvDialogOpen} onOpenChange={(open) => { if (!open) handleCsvDialogClose(); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload CSV Preview</DialogTitle>
            <DialogDescription>
              Review the parsed fee schedules before importing.
            </DialogDescription>
          </DialogHeader>

          {csvResult && (
            <div className="space-y-4 py-2">
              {/* Summary badges */}
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {csvResult.valid.length + csvResult.errors.length} total rows
                </Badge>
                <Badge variant="default">
                  {csvResult.valid.length} valid
                </Badge>
                {csvResult.errors.length > 0 && (
                  <Badge variant="destructive">
                    {csvResult.errors.length} error{csvResult.errors.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              {/* Error table */}
              {csvResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-destructive">Errors</h4>
                  <div className="max-h-40 overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Row</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvResult.errors.map((err, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-xs">
                              {err.row}
                            </TableCell>
                            <TableCell className="text-sm text-destructive">
                              {err.message}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Valid rows preview */}
              {csvResult.valid.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">
                    Preview (first {Math.min(5, csvResult.valid.length)} of{" "}
                    {csvResult.valid.length})
                  </h4>
                  <div className="max-h-52 overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payer</TableHead>
                          <TableHead>HCPCS</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Multiplier</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvResult.valid.slice(0, 5).map((fee) => (
                          <TableRow key={fee.id}>
                            <TableCell className="font-medium">
                              {fee.payer}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {fee.hcpcsCode}
                            </TableCell>
                            <TableCell>{fee.state}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(fee.reimbursementRate)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {fee.multiplier.toFixed(2)}x
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCsvDialogClose}>
              Cancel
            </Button>
            {csvResult && csvResult.valid.length > 0 && (
              <Button onClick={handleImport}>
                Import {csvResult.valid.length} Fee Schedule
                {csvResult.valid.length !== 1 ? "s" : ""}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
