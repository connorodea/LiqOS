"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/liqos/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2, Plus, Trash2, Package } from "lucide-react";

export const dynamic = "force-dynamic";

const LOT_TYPES = ["PALLET", "TRUCKLOAD", "BOX", "GAYLORD"] as const;

interface LotItem {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  grade: string;
  retailPrice: number | null;
  weight?: number | null;
}

export default function NewLotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skuInput, setSkuInput] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [items, setItems] = useState<LotItem[]>([]);

  const totalRetail = items.reduce(
    (sum, item) => sum + (item.retailPrice || 0),
    0
  );

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!skuInput.trim()) return;

    setScanLoading(true);
    try {
      const res = await fetch(
        `/api/liqos/inventory?q=${encodeURIComponent(skuInput.trim())}&limit=1`
      );
      if (!res.ok) throw new Error("Item not found");
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        if (!items.find((i) => i.id === item.id)) {
          setItems((prev) => [
            ...prev,
            {
              id: item.id,
              sku: item.sku,
              name: item.name,
              brand: item.brand,
              grade: item.grade,
              retailPrice: item.retailPrice ? Number(item.retailPrice) : null,
            },
          ]);
        }
        setSkuInput("");
      } else {
        setError(`No item found with SKU: ${skuInput}`);
      }
    } catch {
      setError("Failed to find item");
    } finally {
      setScanLoading(false);
    }
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      lotType: formData.get("lotType") as string,
      warehouseCode: formData.get("warehouseCode") as string,
      category: formData.get("category") as string,
      condition: formData.get("condition") as string,
      askingPrice: formData.get("askingPrice")
        ? Number(formData.get("askingPrice"))
        : null,
      weight: formData.get("weight")
        ? Number(formData.get("weight"))
        : null,
      itemIds: items.map((i) => i.id),
    };

    try {
      const res = await fetch("/api/liqos/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create lot");
      }

      router.push("/liqos/lots");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Build New Lot" description="Assemble items into a lot">
        <Link href="/liqos/lots">
          <Button variant="outline">
            <ArrowLeft className="size-4 mr-1.5" />
            Back
          </Button>
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lot Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Lot Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Lot Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Electronics Pallet #42"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lotType">Lot Type</Label>
                <select
                  id="lotType"
                  name="lotType"
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                  required
                >
                  {LOT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouseCode">Warehouse Code</Label>
                <Input
                  id="warehouseCode"
                  name="warehouseCode"
                  placeholder="e.g. WH-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="e.g. Electronics"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Input
                  id="condition"
                  name="condition"
                  placeholder="e.g. Customer Returns"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="askingPrice">Asking Price ($)</Label>
                <Input
                  id="askingPrice"
                  name="askingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>

              {/* Running totals */}
              <div className="rounded-lg border p-3 space-y-2 bg-muted/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-bold tabular-nums">{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Retail Value</span>
                  <span className="font-bold tabular-nums">
                    ${totalRetail.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3 pt-2">
                <Link href="/liqos/lots" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                  Create Lot
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Lot Items ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SKU scanner */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Scan or enter SKU..."
                    className="pl-9"
                    value={skuInput}
                    onChange={(e) => {
                      setSkuInput(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddItem(e);
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddItem}
                  disabled={scanLoading}
                >
                  {scanLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Add
                </Button>
              </div>

              {/* Items table */}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead className="text-right">Retail</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground"
                        >
                          Scan or search for items to add to this lot
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs font-semibold">
                            {item.sku}
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate">
                            {item.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.brand || "—"}
                          </TableCell>
                          <TableCell className="text-xs uppercase">
                            {item.grade}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {item.retailPrice
                              ? `$${item.retailPrice.toFixed(2)}`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="size-3 text-destructive" />
                            </Button>
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
      </form>
    </div>
  );
}
