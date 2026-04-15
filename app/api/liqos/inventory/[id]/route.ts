import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET /api/liqos/inventory/[id] — Get a single inventory item
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        warehouse: { select: { name: true, code: true } },
        photos: { orderBy: { displayOrder: "asc" } },
        receiving: { select: { receiptNumber: true } },
        lot: { select: { lotNumber: true, name: true } },
        listings: true,
        refurbishment: true,
        labels: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("[LIQOS] GET /inventory/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory item" },
      { status: 500 }
    );
  }
}

// PUT /api/liqos/inventory/[id] — Update an item (grade, test results, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // Grade & testing fields
    if (body.grade !== undefined) updateData.grade = body.grade;
    if (body.functional !== undefined) updateData.functional = body.functional;
    if (body.cosmetic !== undefined) updateData.cosmetic = body.cosmetic || null;
    if (body.missingParts !== undefined) updateData.missingParts = body.missingParts || null;
    if (body.batteryHealth !== undefined) updateData.batteryHealth = body.batteryHealth;
    if (body.testNotes !== undefined) updateData.testNotes = body.testNotes || null;

    // Pricing
    if (body.retailPrice !== undefined) updateData.retailPrice = body.retailPrice;
    if (body.costBasis !== undefined) updateData.costBasis = body.costBasis;
    if (body.sellingPrice !== undefined) updateData.sellingPrice = body.sellingPrice;

    // Location
    if (body.bin !== undefined) updateData.bin = body.bin || null;
    if (body.shelf !== undefined) updateData.shelf = body.shelf || null;
    if (body.zone !== undefined) updateData.zone = body.zone || null;

    // Status
    if (body.status !== undefined) updateData.status = body.status;

    // If grade is being set and item was untested, mark as graded
    if (body.grade && body.grade !== "UNTESTED" && existing.status === "RECEIVED") {
      updateData.status = "GRADED";
      updateData.testedAt = new Date();
    }
    if (body.grade && body.grade !== "UNTESTED" && existing.status === "TESTING") {
      updateData.status = "GRADED";
      updateData.testedAt = new Date();
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        warehouse: { select: { name: true, code: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: body.grade ? "GRADED" : "UPDATED",
        entityType: "ITEM",
        entityId: item.id,
        details: {
          sku: item.sku,
          grade: item.grade,
          status: item.status,
        },
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("[LIQOS] PUT /inventory/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    );
  }
}
