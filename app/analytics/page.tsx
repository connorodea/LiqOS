import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/liqos/page-header";
import { StatCard } from "@/components/liqos/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Boxes, DollarSign, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [
    totalProcessed,
    lotsBuilt,
    gradeDistribution,
    listingsByChannel,
  ] = await Promise.all([
    prisma.inventoryItem.count(),
    prisma.lot.count(),
    prisma.inventoryItem.groupBy({
      by: ["grade"],
      _count: true,
    }),
    prisma.listing.groupBy({
      by: ["channel"],
      where: { status: "SOLD" },
      _count: true,
      _sum: { price: true },
    }),
  ]);

  const totalRevenue = listingsByChannel.reduce(
    (sum, c) => sum + (c._sum.price ? Number(c._sum.price) : 0),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Performance metrics and insights"
      />

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Items Processed"
          value={totalProcessed.toLocaleString()}
          icon={Package}
        />
        <StatCard
          title="Lots Built"
          value={lotsBuilt.toLocaleString()}
          icon={Boxes}
        />
        <StatCard
          title="Revenue (Sold)"
          value={`$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
        />
        <StatCard
          title="Avg Grade Dist."
          value={gradeDistribution.length > 0 ? `${gradeDistribution.length} grades` : "—"}
          icon={BarChart3}
        />
      </div>

      {/* Grade Distribution Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {gradeDistribution.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No graded items yet
            </div>
          ) : (
            <div className="space-y-3">
              {gradeDistribution
                .sort((a, b) => b._count - a._count)
                .map((g) => {
                  const pct = totalProcessed > 0 ? (g._count / totalProcessed) * 100 : 0;
                  return (
                    <div key={g.grade} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {g.grade.replace(/_/g, " ")}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {g._count.toLocaleString()} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground/80 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart Placeholders */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Throughput Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Chart placeholder — Daily items processed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            {listingsByChannel.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                No sold listings data yet
              </div>
            ) : (
              <div className="space-y-3">
                {listingsByChannel
                  .sort((a, b) => (Number(b._sum.price) || 0) - (Number(a._sum.price) || 0))
                  .map((c) => {
                    const revenue = c._sum.price ? Number(c._sum.price) : 0;
                    const pct = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
                    return (
                      <div key={c.channel} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium uppercase">{c.channel}</span>
                          <span className="text-muted-foreground tabular-nums">
                            ${revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })} ({c._count} sold)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-foreground/80 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
