import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET /api/liqos/lots — List all lots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const limit = Number(searchParams.get("limit")) || 100;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const lots = await prisma.lot.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        warehouse: { select: { name: true, code: true } },
        _count: { select: { items: true } },
      },
      take: limit,
    });

    return NextResponse.json({ lots });
  } catch (error) {
    console.error("[LIQOS] GET /lots error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lots" },
      { status: 500 }
    );
  }
}

// POST /api/liqos/lots — Create a new lot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      lotType,
      warehouseCode,
      category,
      condition,
      askingPrice,
      weight,
      itemIds,
    } = body;

    if (!name || !lotType || !warehouseCode) {
      return NextResponse.json(
        { error: "Name, lot type, and warehouse code are required" },
        { status: 400 }
      );
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { code: warehouseCode },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: `Warehouse with code "${warehouseCode}" not found` },
        { status: 404 }
      );
    }

    // Generate lot number
    const count = await prisma.lot.count();
    const lotNumber = `LOT-${String(count + 1).padStart(6, "0")}`;

    // Calculate retail value from items if provided
    let retailValue = null;
    if (itemIds && itemIds.length > 0) {
      const items = await prisma.inventoryItem.findMany({
        where: { id: { in: itemIds } },
        select: { retailPrice: true },
      });
      retailValue = items.reduce(
        (sum, item) => sum + (item.retailPrice ? Number(item.retailPrice) : 0),
        0
      );
    }

    const lot = await prisma.lot.create({
      data: {
        lotNumber,
        name,
        lotType,
        warehouseId: warehouse.id,
        category: category || null,
        condition: condition || null,
        askingPrice: askingPrice ?? null,
        weight: weight ?? null,
        retailValue: retailValue ?? null,
        status: "BUILDING",
      },
      include: {
        warehouse: { select: { name: true, code: true } },
      },
    });

    // Add items to lot
    if (itemIds && itemIds.length > 0) {
      await prisma.inventoryItem.updateMany({
        where: { id: { in: itemIds } },
        data: { lotId: lot.id, status: "IN_LOT" },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "LOT_CREATED",
        entityType: "LOT",
        entityId: lot.id,
        details: {
          lotNumber: lot.lotNumber,
          name: lot.name,
          lotType: lot.lotType,
          itemCount: itemIds?.length || 0,
        },
      },
    });

    return NextResponse.json({ lot }, { status: 201 });
  } catch (error) {
    console.error("[LIQOS] POST /lots error:", error);
    return NextResponse.json(
      { error: "Failed to create lot" },
      { status: 500 }
    );
  }
}
