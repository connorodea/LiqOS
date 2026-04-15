"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import type { InventoryItem } from "@prisma/client";

const GRADES = [
  { value: "UNTESTED", label: "Untested" },
  { value: "LN", label: "Like New" },
  { value: "VG", label: "Very Good" },
  { value: "G", label: "Good" },
  { value: "PO", label: "Poor" },
  { value: "SA", label: "Salvage" },
  { value: "PARTS_ONLY", label: "Parts Only" },
] as const;

interface Props {
  item: InventoryItem;
}

export function ItemGradeForm({ item }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    const data = {
      grade: formData.get("grade") as string,
      functional: formData.get("functional") === "true" ? true : formData.get("functional") === "false" ? false : null,
      cosmetic: formData.get("cosmetic") as string,
      missingParts: formData.get("missingParts") as string,
      batteryHealth: formData.get("batteryHealth") ? Number(formData.get("batteryHealth")) : null,
      testNotes: formData.get("testNotes") as string,
    };

    try {
      const res = await fetch(`/api/liqos/inventory/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update item");
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="grade">Grade</Label>
        <select
          id="grade"
          name="grade"
          defaultValue={item.grade}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
        >
          {GRADES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="functional">Functional</Label>
        <select
          id="functional"
          name="functional"
          defaultValue={item.functional === null ? "" : String(item.functional)}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Not tested</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      <div className="grid gap-4 grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cosmetic">Cosmetic Condition</Label>
          <Input
            id="cosmetic"
            name="cosmetic"
            defaultValue={item.cosmetic || ""}
            placeholder="e.g. Minor scratches"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="batteryHealth">Battery Health (%)</Label>
          <Input
            id="batteryHealth"
            name="batteryHealth"
            type="number"
            min="0"
            max="100"
            defaultValue={item.batteryHealth ?? ""}
            placeholder="0-100"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="missingParts">Missing Parts</Label>
        <Input
          id="missingParts"
          name="missingParts"
          defaultValue={item.missingParts || ""}
          placeholder="e.g. Charger, manual"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="testNotes">Test Notes</Label>
        <Textarea
          id="testNotes"
          name="testNotes"
          defaultValue={item.testNotes || ""}
          placeholder="Additional testing observations..."
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-green-700">Item updated successfully.</p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <Loader2 className="size-4 mr-1.5 animate-spin" />
        ) : (
          <Save className="size-4 mr-1.5" />
        )}
        Save Grade & Test Results
      </Button>
    </form>
  );
}
