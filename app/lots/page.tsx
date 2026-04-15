import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/liqos/page-header";
import { StatusBadge } from "@/components/liqos/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LotsPage() {
  const lots = await prisma.lot.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      warehouse: { select: { name: true, code: true } },
      _count: { select: { items: true } },
    },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lot Builder"
        description="Build and manage liquidation lots"
      >
        <Link href="/liqos/lots/new">
          <Button size="lg">
            <Plus className="size-4 mr-1.5" />
            Build New Lot
          </Button>
        </Link>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Weight (lbs)</TableHead>
                <TableHead className="text-right">Retail Value</TableHead>
                <TableHead className="text-right">Asking Price</TableHead>
                <TableHead>Warehouse</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No lots created yet. Build your first lot.
                  </TableCell>
                </TableRow>
              ) : (
                lots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell>
                      <Link
                        href={`/liqos/lots/${lot.id}`}
                        className="font-mono text-xs font-semibold hover:underline"
                      >
                        {lot.lotNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate font-medium">
                      {lot.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {lot.lotType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={lot.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {lot._count.items.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {lot.weight ? `${Number(lot.weight).toFixed(0)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {lot.retailValue
                        ? `$${Number(lot.retailValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {lot.askingPrice
                        ? `$${Number(lot.askingPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{lot.warehouse.code}</span>
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
