"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import type { Product } from "@/lib/types";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusIcon, MoreHorizontalIcon, PencilIcon, TrashIcon } from "lucide-react";

function generateProductId(): string {
  return `prod-${String(Math.floor(Math.random() * 900) + 100)}`;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

interface ProductFormState {
  name: string;
  vendor: string;
  hcpcsCode: string;
  cost: string;
  msrp: string;
  category: string;
  requiresMeasurement: boolean;
  requiresPriorAuth: boolean;
}

const emptyForm: ProductFormState = {
  name: "",
  vendor: "",
  hcpcsCode: "",
  cost: "",
  msrp: "",
  category: "",
  requiresMeasurement: false,
  requiresPriorAuth: false,
};

function productToForm(product: Product): ProductFormState {
  return {
    name: product.name,
    vendor: product.vendor,
    hcpcsCode: product.hcpcsCode,
    cost: String(product.cost),
    msrp: String(product.msrp),
    category: product.category,
    requiresMeasurement: product.requiresMeasurement,
    requiresPriorAuth: product.requiresPriorAuth,
  };
}

export default function ProductsPage() {
  const products = useAppStore((s) => s.products);
  const addProduct = useAppStore((s) => s.addProduct);
  const updateProduct = useAppStore((s) => s.updateProduct);
  const deleteProduct = useAppStore((s) => s.deleteProduct);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  function openAddDialog() {
    setEditingProduct(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    setForm(productToForm(product));
    setDialogOpen(true);
  }

  function openDeleteDialog(product: Product) {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  }

  function handleSave() {
    const cost = parseFloat(form.cost);
    const msrp = parseFloat(form.msrp);

    if (!form.name || !form.vendor || !form.hcpcsCode || isNaN(cost) || isNaN(msrp) || !form.category) {
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: form.name,
        vendor: form.vendor,
        hcpcsCode: form.hcpcsCode,
        cost,
        msrp,
        category: form.category,
        requiresMeasurement: form.requiresMeasurement,
        requiresPriorAuth: form.requiresPriorAuth,
      });
    } else {
      addProduct({
        id: generateProductId(),
        name: form.name,
        vendor: form.vendor,
        hcpcsCode: form.hcpcsCode,
        cost,
        msrp,
        category: form.category,
        requiresMeasurement: form.requiresMeasurement,
        requiresPriorAuth: form.requiresPriorAuth,
      });
    }

    setDialogOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
  }

  function handleDelete() {
    if (deletingProduct) {
      deleteProduct(deletingProduct.id);
      setDeleteDialogOpen(false);
      setDeletingProduct(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button onClick={openAddDialog}>
                <PlusIcon data-icon="inline-start" />
                Add Product
              </Button>
            }
          />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Update the product details below."
                  : "Fill in the details to add a new product."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="product-name">Product Name *</Label>
                <Input
                  id="product-name"
                  value={form.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="e.g., Compression Sleeve - Upper Arm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="product-vendor">Vendor *</Label>
                  <Input
                    id="product-vendor"
                    value={form.vendor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, vendor: e.target.value })
                    }
                    placeholder="e.g., Medi"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="product-hcpcs">HCPCS Code *</Label>
                  <Input
                    id="product-hcpcs"
                    value={form.hcpcsCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, hcpcsCode: e.target.value })
                    }
                    placeholder="e.g., A6530"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="product-cost">Cost ($) *</Label>
                  <Input
                    id="product-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, cost: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="product-msrp">MSRP ($) *</Label>
                  <Input
                    id="product-msrp"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.msrp}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, msrp: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-category">Category *</Label>
                <Input
                  id="product-category"
                  value={form.category}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="e.g., Compression Garments"
                />
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="product-measurement"
                    checked={form.requiresMeasurement}
                    onCheckedChange={(checked: boolean) =>
                      setForm({ ...form, requiresMeasurement: checked })
                    }
                  />
                  <Label htmlFor="product-measurement" className="text-sm font-normal">
                    Requires Measurement
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="product-prior-auth"
                    checked={form.requiresPriorAuth}
                    onCheckedChange={(checked: boolean) =>
                      setForm({ ...form, requiresPriorAuth: checked })
                    }
                  />
                  <Label htmlFor="product-prior-auth" className="text-sm font-normal">
                    Requires Prior Auth
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button onClick={handleSave}>
                {editingProduct ? "Update Product" : "Add Product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            {products.length} {products.length === 1 ? "product" : "products"} in catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>HCPCS Code</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">MSRP</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Measurement</TableHead>
                <TableHead>Prior Auth</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No products found. Add your first product to get started.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium max-w-[260px] truncate">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.vendor}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {product.hcpcsCode}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.msrp)}
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <Badge
                        variant={product.requiresMeasurement ? "secondary" : "outline"}
                        className={
                          product.requiresMeasurement
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : ""
                        }
                      >
                        {product.requiresMeasurement ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.requiresPriorAuth ? "destructive" : "outline"}
                      >
                        {product.requiresPriorAuth ? "Yes" : "No"}
                      </Badge>
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
                            onClick={() => openEditDialog(product)}
                          >
                            <PencilIcon />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(product)}
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
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deletingProduct?.name}
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
    </div>
  );
}
