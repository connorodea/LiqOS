import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// POST /api/liqos/lots/[id]/items — Add item(s) to a lot
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { itemIds } = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "itemIds array is required" },
        { status: 400 }
      );
    }

    const lot = await prisma.lot.findUnique({ where: { id } });
    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    // Update items to belong to this lot
    const result = await prisma.inventoryItem.updateMany({
      where: {
        id: { in: itemIds },
        lotId: null, // Only add items that aren't already in a lot
      },
      data: { lotId: id, status: "IN_LOT" },
    });

    // Recalculate retail value
    const items = await prisma.inventoryItem.findMany({
      where: { lotId: id },
      select: { retailPrice: true },
    });
    const retailValue = items.reduce(
      (sum, item) => sum + (item.retailPrice ? Number(item.retailPrice) : 0),
      0
    );

    await prisma.lot.update({
      where: { id },
      data: { retailValue },
    });

    return NextResponse.json({
      added: result.count,
      totalItems: items.length,
      retailValue,
    });
  } catch (error) {
    console.error("[LIQOS] POST /lots/[id]/items error:", error);
    return NextResponse.json(
      { error: "Failed to add items to lot" },
      { status: 500 }
    );
  }
}

// DELETE /api/liqos/lots/[id]/items — Remove item(s) from a lot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { itemIds } = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "itemIds array is required" },
        { status: 400 }
      );
    }

    const lot = await prisma.lot.findUnique({ where: { id } });
    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    // Remove items from lot
    const result = await prisma.inventoryItem.updateMany({
      where: {
        id: { in: itemIds },
        lotId: id,
      },
      data: { lotId: null, status: "GRADED" },
    });

    // Recalculate retail value
    const items = await prisma.inventoryItem.findMany({
      where: { lotId: id },
      select: { retailPrice: true },
    });
    const retailValue = items.reduce(
      (sum, item) => sum + (item.retailPrice ? Number(item.retailPrice) : 0),
      0
    );

    await prisma.lot.update({
      where: { id },
      data: { retailValue },
    });

    return NextResponse.json({
      removed: result.count,
      totalItems: items.length,
      retailValue,
    });
  } catch (error) {
    console.error("[LIQOS] DELETE /lots/[id]/items error:", error);
    return NextResponse.json(
      { error: "Failed to remove items from lot" },
      { status: 500 }
    );
  }
}
