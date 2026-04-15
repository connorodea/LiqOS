import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/liqos/page-header";
import { StatusBadge, GradeBadge } from "@/components/liqos/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InventoryFilters } from "./inventory-filters";
import { Plus } from "lucide-react";
import type { InventoryStatus, ItemGrade } from "@prisma/client";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    status?: string;
    grade?: string;
    warehouse?: string;
    category?: string;
    q?: string;
  }>;
}

export default async function InventoryPage({ searchParams }: Props) {
  const params = await searchParams;

  const where: Record<string, unknown> = {};

  if (params.status) {
    where.status = params.status as InventoryStatus;
  }
  if (params.grade) {
    where.grade = params.grade as ItemGrade;
  }
  if (params.warehouse) {
    where.warehouseId = params.warehouse;
  }
  if (params.category) {
    where.category = params.category;
  }
  if (params.q) {
    where.OR = [
      { sku: { contains: params.q, mode: "insensitive" } },
      { name: { contains: params.q, mode: "insensitive" } },
      { brand: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const [items, warehouses] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        warehouse: { select: { name: true, code: true } },
      },
      take: 100,
    }),
    prisma.warehouse.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Testing & Grading"
        description="Manage inventory items, test and assign grades"
      >
        <Link href="/liqos/inventory/new">
          <Button size="lg">
            <Plus className="size-4 mr-1.5" />
            Add Item
          </Button>
        </Link>
      </PageHeader>

      <InventoryFilters
        warehouses={warehouses}
        currentFilters={params}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Bin</TableHead>
                <TableHead className="text-right">Retail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No inventory items found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        href={`/liqos/inventory/${item.id}`}
                        className="font-mono text-xs font-semibold hover:underline"
                      >
                        {item.sku}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.brand || "—"}
                    </TableCell>
                    <TableCell>
                      <GradeBadge grade={item.grade} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{item.warehouse.code}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.bin || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.retailPrice
                        ? `$${Number(item.retailPrice).toFixed(2)}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
