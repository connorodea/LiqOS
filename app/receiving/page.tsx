import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/liqos/page-header";
import { StatusBadge } from "@/components/liqos/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default async function ReceivingPage() {
  const receivings = await prisma.receiving.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      warehouse: { select: { name: true, code: true } },
    },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receiving"
        description="Manage incoming inventory shipments"
      >
        <Link href="/liqos/receiving/new">
          <Button size="lg">
            <Plus className="size-4 mr-1.5" />
            New Receiving
          </Button>
        </Link>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receivings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No receivings yet. Create your first one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                receivings.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {r.receiptNumber}
                    </TableCell>
                    <TableCell>{r.supplier || "—"}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{r.warehouse.code}</span>
                      <span className="text-muted-foreground ml-1.5 text-xs">
                        {r.warehouse.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.expectedUnits?.toLocaleString() ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.receivedUnits.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(r.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
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
