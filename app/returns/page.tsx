import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  // Returns are items that came back and need re-processing
  const returnItems = await prisma.inventoryItem.findMany({
    where: { status: "RECEIVED", condition: { contains: "return" } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { warehouse: { select: { code: true } } },
  });

  // Also show items in REFURBISHING status
  const refurbItems = await prisma.inventoryItem.findMany({
    where: { status: "REFURBISHING" },
    orderBy: { updatedAt: "desc" },
    include: { warehouse: { select: { code: true } } },
  });

  const allItems = [...returnItems, ...refurbItems];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Returns Processing</h1>
          <p className="text-sm text-muted-foreground">Process returned items — inspect, grade, and disposition</p>
        </div>
        <Link href="/receiving/new">
          <Button className="gap-2"><RotateCcw className="h-4 w-4" /> New Return Intake</Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-bold">{returnItems.length}</p>
          <p className="text-xs text-muted-foreground">Awaiting Inspection</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-bold">{refurbItems.length}</p>
          <p className="text-xs text-muted-foreground">In Refurbishment</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-bold">{returnItems.length + refurbItems.length}</p>
          <p className="text-xs text-muted-foreground">Total in Pipeline</p>
        </div>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left font-medium">SKU</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Grade</th>
              <th className="px-4 py-3 text-left font-medium">Warehouse</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allItems.map((item) => (
              <tr key={item.id} className="border-b hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3"><Badge variant="outline">{item.status}</Badge></td>
                <td className="px-4 py-3"><Badge variant="secondary">{item.grade}</Badge></td>
                <td className="px-4 py-3 text-muted-foreground">{item.warehouse.code}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={"/inventory/" + item.id}>
                    <Button variant="outline" size="sm">Inspect</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {allItems.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No returns in the pipeline. Use "New Return Intake" to process incoming returns.
          </div>
        )}
      </div>
    </div>
  );
}
