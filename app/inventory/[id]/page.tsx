import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/liqos/page-header";
import { StatusBadge, GradeBadge } from "@/components/liqos/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera } from "lucide-react";
import Link from "next/link";
import { ItemGradeForm } from "./grade-form";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InventoryItemPage({ params }: Props) {
  const { id } = await params;

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      warehouse: { select: { name: true, code: true } },
      photos: { orderBy: { displayOrder: "asc" } },
      receiving: { select: { receiptNumber: true } },
      lot: { select: { lotNumber: true, name: true } },
    },
  });

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.name}
        description={`SKU: ${item.sku}`}
      >
        <Link href="/liqos/inventory">
          <Button variant="outline">
            <ArrowLeft className="size-4 mr-1.5" />
            Back to Inventory
          </Button>
        </Link>
      </PageHeader>

      <div className="flex gap-2">
        <StatusBadge status={item.status} />
        <GradeBadge grade={item.grade} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Item Info */}
        <Card>
          <CardHeader>
            <CardTitle>Item Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{item.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Brand</dt>
                <dd className="font-medium">{item.brand || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Model</dt>
                <dd className="font-medium">{item.model || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">UPC</dt>
                <dd className="font-mono text-xs">{item.upc || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium">{item.category || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Condition</dt>
                <dd className="font-medium">{item.condition || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Barcode</dt>
                <dd className="font-mono text-xs">{item.barcode || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Receiving</dt>
                <dd className="font-mono text-xs">
                  {item.receiving?.receiptNumber || "—"}
                </dd>
              </div>
              {item.lot && (
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Lot</dt>
                  <dd className="font-medium">
                    <Badge variant="outline" className="font-mono text-xs">
                      {item.lot.lotNumber}
                    </Badge>{" "}
                    {item.lot.name}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Testing & Grading */}
        <Card>
          <CardHeader>
            <CardTitle>Testing & Grading</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemGradeForm item={item} />
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Retail Price</dt>
                <dd className="text-lg font-bold tabular-nums">
                  {item.retailPrice ? `$${Number(item.retailPrice).toFixed(2)}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cost Basis</dt>
                <dd className="text-lg font-bold tabular-nums">
                  {item.costBasis ? `$${Number(item.costBasis).toFixed(2)}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Selling Price</dt>
                <dd className="text-lg font-bold tabular-nums">
                  {item.sellingPrice ? `$${Number(item.sellingPrice).toFixed(2)}` : "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Warehouse</dt>
                <dd className="font-medium">
                  <span className="font-mono text-xs mr-1">{item.warehouse.code}</span>
                  {item.warehouse.name}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Zone</dt>
                <dd className="font-medium">{item.zone || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Shelf</dt>
                <dd className="font-medium">{item.shelf || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Bin</dt>
                <dd className="font-mono font-medium">{item.bin || "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Photos</CardTitle>
            <Button variant="outline" size="sm">
              <Camera className="size-3 mr-1.5" />
              Add Photo
            </Button>
          </CardHeader>
          <CardContent>
            {item.photos.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                No photos uploaded yet
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {item.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-lg border overflow-hidden bg-muted"
                  >
                    <img
                      src={photo.url}
                      alt={photo.alt || item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
