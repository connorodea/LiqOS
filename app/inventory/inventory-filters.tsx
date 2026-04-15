"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useCallback, useState } from "react";

const STATUSES = [
  "RECEIVED",
  "TESTING",
  "GRADED",
  "IN_LOT",
  "LISTED",
  "SOLD",
  "SHIPPED",
  "REFURBISHING",
  "RECYCLED",
  "DISPOSED",
];

const GRADES = ["UNTESTED", "LN", "VG", "G", "PO", "SA", "PARTS_ONLY"];

interface Props {
  warehouses: { id: string; name: string; code: string }[];
  currentFilters: {
    status?: string;
    grade?: string;
    warehouse?: string;
    category?: string;
    q?: string;
  };
}

export function InventoryFilters({ warehouses, currentFilters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(currentFilters.q || "");

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/liqos/inventory?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    setSearchTerm("");
    router.push("/liqos/inventory");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("q", searchTerm);
  };

  const hasFilters =
    currentFilters.status ||
    currentFilters.grade ||
    currentFilters.warehouse ||
    currentFilters.q;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search SKU, name, brand..."
          className="pl-9 h-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      {/* Status filter */}
      <select
        className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
        value={currentFilters.status || ""}
        onChange={(e) => updateFilter("status", e.target.value)}
      >
        <option value="">All Statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      {/* Grade filter */}
      <select
        className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
        value={currentFilters.grade || ""}
        onChange={(e) => updateFilter("grade", e.target.value)}
      >
        <option value="">All Grades</option>
        {GRADES.map((g) => (
          <option key={g} value={g}>
            {g.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      {/* Warehouse filter */}
      <select
        className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
        value={currentFilters.warehouse || ""}
        onChange={(e) => updateFilter("warehouse", e.target.value)}
      >
        <option value="">All Warehouses</option>
        {warehouses.map((w) => (
          <option key={w.id} value={w.id}>
            {w.code} — {w.name}
          </option>
        ))}
      </select>

      {/* Clear */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="size-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
