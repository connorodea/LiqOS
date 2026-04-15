import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/liqos/inventory — List items with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const grade = searchParams.get("grade");
    const warehouseId = searchParams.get("warehouseId");
    const category = searchParams.get("category");
    const q = searchParams.get("q");
    const limit = Number(searchParams.get("limit")) || 100;

    const where: Prisma.InventoryItemWhereInput = {};

    if (status) where.status = status as Prisma.EnumInventoryStatusFilter;
    if (grade) where.grade = grade as Prisma.EnumItemGradeFilter;
    if (warehouseId) where.warehouseId = warehouseId;
    if (category) where.category = category;

    if (q) {
      where.OR = [
        { sku: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
      ];
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        warehouse: { select: { name: true, code: true } },
      },
      take: limit,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[LIQOS] GET /inventory error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

// POST /api/liqos/inventory — Create a new inventory item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      brand,
      model,
      upc,
      category,
      condition,
      warehouseCode,
      receivingId,
      retailPrice,
      costBasis,
      bin,
      shelf,
      zone,
    } = body;

    if (!name || !warehouseCode) {
      return NextResponse.json(
        { error: "Name and warehouse code are required" },
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

    // Generate SKU
    const count = await prisma.inventoryItem.count();
    const sku = `ITM-${String(count + 1).padStart(7, "0")}`;

    const item = await prisma.inventoryItem.create({
      data: {
        sku,
        name,
        brand: brand || null,
        model: model || null,
        upc: upc || null,
        category: category || null,
        condition: condition || null,
        warehouseId: warehouse.id,
        receivingId: receivingId || null,
        retailPrice: retailPrice ?? null,
        costBasis: costBasis ?? null,
        bin: bin || null,
        shelf: shelf || null,
        zone: zone || null,
        status: "RECEIVED",
        grade: "UNTESTED",
      },
      include: {
        warehouse: { select: { name: true, code: true } },
      },
    });

    // If linked to a receiving, increment received count
    if (receivingId) {
      await prisma.receiving.update({
        where: { id: receivingId },
        data: { receivedUnits: { increment: 1 } },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "RECEIVED",
        entityType: "ITEM",
        entityId: item.id,
        details: { sku: item.sku, name: item.name },
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("[LIQOS] POST /inventory error:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}
