import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const STORE_API_URL = process.env.UPSCALEDIST_API_URL || "https://upscaledist.com/api";

export async function POST(request: NextRequest) {
  try {
    const { lotId } = await request.json();

    if (!lotId) {
      return NextResponse.json({ error: "lotId required" }, { status: 400 });
    }

    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      include: {
        items: { orderBy: { sku: "asc" } },
        warehouse: true,
        photos: { orderBy: { displayOrder: "asc" } },
      },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    if (lot.publishedToStore) {
      return NextResponse.json({
        message: "Already published",
        storeProductId: lot.storeProductId,
      });
    }

    // Calculate totals
    const totalRetail = lot.items.reduce(
      (sum, item) => sum + (item.retailPrice ? Number(item.retailPrice) : 0),
      0
    );
    const totalWeight = lot.items.reduce(
      (sum, item) => sum + (item.costBasis ? Number(item.costBasis) : 0),
      0
    );

    // Build product payload for upscaledist.com
    const productPayload = {
      sku: `LIQOS-${lot.lotNumber}`,
      slug: `liqos-${lot.lotNumber.toLowerCase()}`,
      name: lot.name,
      description: `${lot.name}. ${lot.items.length} items from ${lot.warehouse.name}. Processed and manifested by LiqOS.`,
      shortDesc: `${lot.lotType} with ${lot.items.length} items. Manifested.`,
      price: lot.askingPrice ? Number(lot.askingPrice) : 0,
      compareAt: totalRetail,
      quantity: 1,
      isFeatured: false,
      lotType: lot.lotType === "TRUCKLOAD" ? "TRUCKLOAD" : lot.lotType === "BOX" ? "BOX" : "PALLET",
      condition: lot.condition || "Customer Returns",
      grade: "G",
      itemCount: lot.items.length,
      retailValue: totalRetail,
      weight: Number(lot.weight) || 0,
      supplier: "Upscaled Distribution (LiqOS)",
      warehouse: `${lot.warehouse.city}, ${lot.warehouse.state}`,
      categoryId: null, // Will need to be mapped
    };

    // Try to publish to the store API
    try {
      const storeRes = await fetch(`${STORE_API_URL}/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productPayload),
      });

      if (storeRes.ok) {
        const storeData = await storeRes.json();

        // Mark as published
        await prisma.lot.update({
          where: { id: lotId },
          data: {
            publishedToStore: true,
            storeProductId: storeData.id || "published",
            status: "LISTED_FOR_SALE",
          },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            action: "PUBLISHED_TO_STORE",
            entityType: "LOT",
            entityId: lotId,
            details: { storeProductId: storeData.id, price: productPayload.price },
          },
        });

        return NextResponse.json({
          success: true,
          message: `Lot ${lot.lotNumber} published to upscaledist.com`,
          storeProductId: storeData.id,
        });
      } else {
        // Store API failed — mark as ready but not published
        await prisma.lot.update({
          where: { id: lotId },
          data: { status: "LISTED_FOR_SALE" },
        });

        return NextResponse.json({
          success: true,
          message: `Lot ${lot.lotNumber} marked for sale (store sync pending)`,
          warning: "Could not reach store API — will retry",
        });
      }
    } catch {
      // Network error to store — still mark lot as ready
      await prisma.lot.update({
        where: { id: lotId },
        data: { status: "LISTED_FOR_SALE" },
      });

      return NextResponse.json({
        success: true,
        message: `Lot ${lot.lotNumber} marked for sale (store offline)`,
        warning: "Store API unreachable — will sync when available",
      });
    }
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

// GET: List all lots that need syncing
export async function GET() {
  const unsynced = await prisma.lot.findMany({
    where: {
      status: { in: ["READY", "MANIFESTED", "LISTED_FOR_SALE"] },
      publishedToStore: false,
    },
    include: {
      _count: { select: { items: true } },
      warehouse: { select: { code: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    count: unsynced.length,
    lots: unsynced.map((lot) => ({
      id: lot.id,
      lotNumber: lot.lotNumber,
      name: lot.name,
      lotType: lot.lotType,
      status: lot.status,
      items: lot._count.items,
      askingPrice: lot.askingPrice ? Number(lot.askingPrice) : null,
      warehouse: lot.warehouse.code,
    })),
  });
}
