import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET /api/liqos/refurbishment — List refurbishment jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const limit = Number(searchParams.get("limit")) || 100;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const jobs = await prisma.refurbishmentJob.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      include: {
        inventoryItem: {
          select: { sku: true, name: true, grade: true, brand: true },
        },
      },
      take: limit,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("[LIQOS] GET /refurbishment error:", error);
    return NextResponse.json(
      { error: "Failed to fetch refurbishment jobs" },
      { status: 500 }
    );
  }
}

// POST /api/liqos/refurbishment — Create a refurbishment job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      inventoryItemId,
      jobType,
      assignedTo,
      priority,
      issueDescription,
    } = body;

    if (!inventoryItemId) {
      return NextResponse.json(
        { error: "inventoryItemId is required" },
        { status: 400 }
      );
    }

    // Check item exists
    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    // Check no existing job for this item
    const existingJob = await prisma.refurbishmentJob.findUnique({
      where: { inventoryItemId },
    });

    if (existingJob) {
      return NextResponse.json(
        { error: "A refurbishment job already exists for this item" },
        { status: 409 }
      );
    }

    const job = await prisma.refurbishmentJob.create({
      data: {
        inventoryItemId,
        jobType: jobType || null,
        assignedTo: assignedTo || null,
        priority: priority ?? 0,
        issueDescription: issueDescription || null,
        gradeBefore: item.grade,
        valueBefore: item.sellingPrice ?? item.retailPrice ?? null,
        status: "QUEUED",
      },
      include: {
        inventoryItem: {
          select: { sku: true, name: true, grade: true },
        },
      },
    });

    // Update item status
    await prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { status: "REFURBISHING" },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "REFURB_QUEUED",
        entityType: "ITEM",
        entityId: inventoryItemId,
        details: {
          sku: item.sku,
          jobType,
          assignedTo,
        },
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("[LIQOS] POST /refurbishment error:", error);
    return NextResponse.json(
      { error: "Failed to create refurbishment job" },
      { status: 500 }
    );
  }
}
