import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/liqos/page-header";
import { StatCard } from "@/components/liqos/stat-card";
import { StatusBadge } from "@/components/liqos/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart, Globe, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const [listings, channelCounts] = await Promise.all([
    prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        inventoryItem: { select: { sku: true, name: true } },
      },
      take: 100,
    }),
    prisma.listing.groupBy({
      by: ["channel"],
      where: { status: "ACTIVE" },
      _count: true,
    }),
  ]);

  const totalActive = channelCounts.reduce((sum, c) => sum + c._count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listings"
        description="Cross-channel listing management"
      />

      {/* Channel stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Active"
          value={totalActive.toLocaleString()}
          icon={ShoppingCart}
        />
        {channelCounts.slice(0, 3).map((c) => (
          <StatCard
            key={c.channel}
            title={c.channel}
            value={c._count.toLocaleString()}
            icon={Globe}
          />
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Item SKU</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Listed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No listings yet.
                  </TableCell>
                </TableRow>
              ) : (
                listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="max-w-[250px] truncate font-medium">
                      {listing.listingUrl ? (
                        <a
                          href={listing.listingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {listing.title}
                        </a>
                      ) : (
                        listing.title
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {listing.channel}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {listing.inventoryItem.sku}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={listing.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      ${Number(listing.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {listing.listedAt
                        ? new Date(listing.listedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
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
