import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET /api/liqos/receivings — List all receivings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const warehouseId = searchParams.get("warehouseId");
    const limit = Number(searchParams.get("limit")) || 100;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (warehouseId) where.warehouseId = warehouseId;

    const receivings = await prisma.receiving.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        warehouse: { select: { name: true, code: true } },
        _count: { select: { items: true } },
      },
      take: limit,
    });

    return NextResponse.json({ receivings });
  } catch (error) {
    console.error("[LIQOS] GET /receivings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch receivings" },
      { status: 500 }
    );
  }
}

// POST /api/liqos/receivings — Create a new receiving
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { warehouseCode, supplier, poNumber, expectedUnits, notes } = body;

    if (!warehouseCode) {
      return NextResponse.json(
        { error: "Warehouse code is required" },
        { status: 400 }
      );
    }

    // Look up warehouse by code
    const warehouse = await prisma.warehouse.findUnique({
      where: { code: warehouseCode },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: `Warehouse with code "${warehouseCode}" not found` },
        { status: 404 }
      );
    }

    // Generate receipt number
    const count = await prisma.receiving.count();
    const receiptNumber = `RCV-${String(count + 1).padStart(6, "0")}`;

    const receiving = await prisma.receiving.create({
      data: {
        receiptNumber,
        warehouseId: warehouse.id,
        supplier: supplier || null,
        poNumber: poNumber || null,
        expectedUnits: expectedUnits ?? null,
        notes: notes || null,
        status: "PENDING",
      },
      include: {
        warehouse: { select: { name: true, code: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "RECEIVED",
        entityType: "RECEIVING",
        entityId: receiving.id,
        details: {
          receiptNumber: receiving.receiptNumber,
          supplier: receiving.supplier,
          warehouseCode,
        },
      },
    });

    return NextResponse.json({ receiving }, { status: 201 });
  } catch (error) {
    console.error("[LIQOS] POST /receivings error:", error);
    return NextResponse.json(
      { error: "Failed to create receiving" },
      { status: 500 }
    );
  }
}
