import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET /api/liqos/shipments — List all shipments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const limit = Number(searchParams.get("limit")) || 100;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const shipments = await prisma.shipment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ shipments });
  } catch (error) {
    console.error("[LIQOS] GET /shipments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 }
    );
  }
}

// POST /api/liqos/shipments — Create a new shipment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      carrier,
      service,
      trackingNumber,
      trackingUrl,
      shipFromAddress,
      shipToAddress,
      weight,
      dimensions,
      shippingCost,
    } = body;

    // Generate shipment number
    const count = await prisma.shipment.count();
    const shipmentNumber = `SHP-${String(count + 1).padStart(6, "0")}`;

    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber,
        carrier: carrier || null,
        service: service || null,
        trackingNumber: trackingNumber || null,
        trackingUrl: trackingUrl || null,
        shipFrom: shipFromAddress || null,
        shipTo: shipToAddress || null,
        weight: weight ?? null,
        dimensions: dimensions || null,
        shippingCost: shippingCost ?? null,
        status: "PREPARING",
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "SHIPMENT_CREATED",
        entityType: "SHIPMENT",
        entityId: shipment.id,
        details: {
          shipmentNumber: shipment.shipmentNumber,
          carrier: shipment.carrier,
        },
      },
    });

    return NextResponse.json({ shipment }, { status: 201 });
  } catch (error) {
    console.error("[LIQOS] POST /shipments error:", error);
    return NextResponse.json(
      { error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}
