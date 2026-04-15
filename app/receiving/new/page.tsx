"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/liqos/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NewReceivingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      warehouseCode: formData.get("warehouseCode") as string,
      supplier: formData.get("supplier") as string,
      poNumber: formData.get("poNumber") as string,
      expectedUnits: formData.get("expectedUnits")
        ? Number(formData.get("expectedUnits"))
        : null,
      notes: formData.get("notes") as string,
    };

    try {
      const res = await fetch("/api/liqos/receivings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create receiving");
      }

      router.push("/liqos/receiving");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New Receiving" description="Log an incoming shipment">
        <Link href="/liqos/receiving">
          <Button variant="outline">
            <ArrowLeft className="size-4 mr-1.5" />
            Back
          </Button>
        </Link>
      </PageHeader>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Receiving Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  name="supplier"
                  placeholder="e.g. Best Buy"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="poNumber">PO Number</Label>
                <Input
                  id="poNumber"
                  name="poNumber"
                  placeholder="PO-12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedUnits">Expected Units</Label>
                <Input
                  id="expectedUnits"
                  name="expectedUnits"
                  type="number"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any additional details about this receiving..."
                rows={3}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/liqos/receiving">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                Create Receiving
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
