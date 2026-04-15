import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/liqos/page-header";
import { StatCard } from "@/components/liqos/stat-card";
import { StatusBadge } from "@/components/liqos/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  ClipboardCheck,
  Boxes,
  ShoppingCart,
  Truck,
  Wrench,
  Plus,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LiqOSDashboard() {
  const [
    totalItems,
    itemsInTesting,
    lotsBuilt,
    activeListings,
    pendingShipments,
    refurbQueue,
    recentActivity,
  ] = await Promise.all([
    prisma.inventoryItem.count(),
    prisma.inventoryItem.count({ where: { status: "TESTING" } }),
    prisma.lot.count(),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.shipment.count({
      where: { status: { in: ["PREPARING", "LABEL_CREATED"] } },
    }),
    prisma.refurbishmentJob.count({
      where: { status: { in: ["QUEUED", "IN_PROGRESS"] } },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your liquidation operations"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Items"
          value={totalItems.toLocaleString()}
          icon={Package}
        />
        <StatCard
          title="In Testing"
          value={itemsInTesting.toLocaleString()}
          icon={ClipboardCheck}
        />
        <StatCard
          title="Lots Built"
          value={lotsBuilt.toLocaleString()}
          icon={Boxes}
        />
        <StatCard
          title="Active Listings"
          value={activeListings.toLocaleString()}
          icon={ShoppingCart}
        />
        <StatCard
          title="Pending Shipments"
          value={pendingShipments.toLocaleString()}
          icon={Truck}
        />
        <StatCard
          title="Refurb Queue"
          value={refurbQueue.toLocaleString()}
          icon={Wrench}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/liqos/receiving/new">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                  <Plus className="size-5" />
                  <span className="text-xs">New Receiving</span>
                </Button>
              </Link>
              <Link href="/liqos/inventory">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                  <ClipboardCheck className="size-5" />
                  <span className="text-xs">Grade Item</span>
                </Button>
              </Link>
              <Link href="/liqos/lots/new">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                  <Boxes className="size-5" />
                  <span className="text-xs">Build Lot</span>
                </Button>
              </Link>
              <Link href="/liqos/listings">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                  <ShoppingCart className="size-5" />
                  <span className="text-xs">Create Listing</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/liqos/analytics">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="size-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No recent activity. Start by creating a new receiving.
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <StatusBadge status={log.action} />
                    <div className="flex-1 min-w-0">
                      <span className="text-muted-foreground">
                        {log.entityType}
                      </span>
                      <span className="mx-1 text-muted-foreground/50">|</span>
                      <span className="font-mono text-xs">{log.entityId.slice(0, 8)}</span>
                    </div>
                    <time className="text-xs text-muted-foreground shrink-0">
                      {new Date(log.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Throughput Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Chart placeholder — Items processed per day
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Chart placeholder — Grade breakdown pie chart
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
