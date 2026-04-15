import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ManifestsPage() {
  const lots = await prisma.lot.findMany({
    where: { status: { not: "BUILDING" } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } }, warehouse: { select: { code: true } } },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manifests</h1>
          <p className="text-sm text-muted-foreground">Generate and manage lot manifests</p>
        </div>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left font-medium">Lot #</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-center font-medium">Items</th>
              <th className="px-4 py-3 text-right font-medium">Retail Value</th>
              <th className="px-4 py-3 text-center font-medium">Manifest</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((lot) => (
              <tr key={lot.id} className="border-b hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-xs">{lot.lotNumber}</td>
                <td className="px-4 py-3 font-medium">{lot.name}</td>
                <td className="px-4 py-3"><Badge variant="outline">{lot.lotType}</Badge></td>
                <td className="px-4 py-3 text-center">{lot._count.items}</td>
                <td className="px-4 py-3 text-right">{lot.retailValue ? `$${Number(lot.retailValue).toLocaleString()}` : "—"}</td>
                <td className="px-4 py-3 text-center">
                  {lot.manifestGenerated ? (
                    <Badge className="bg-green-100 text-green-800">Generated</Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={"/api/liqos/manifests/" + lot.id + "/generate"}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <FileText className="h-3 w-3" /> Generate
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {lots.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No lots ready for manifest generation. Build a lot first.
          </div>
        )}
      </div>
    </div>
  );
}
