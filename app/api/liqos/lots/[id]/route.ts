import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET /api/liqos/lots/[id] — Get a single lot with items
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lot = await prisma.lot.findUnique({
      where: { id },
      include: {
        warehouse: { select: { name: true, code: true } },
        items: {
          include: {
            warehouse: { select: { code: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        photos: { orderBy: { displayOrder: "asc" } },
      },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    return NextResponse.json({ lot });
  } catch (error) {
    console.error("[LIQOS] GET /lots/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lot" },
      { status: 500 }
    );
  }
}

// PUT /api/liqos/lots/[id] — Update a lot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.lot.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.lotType !== undefined) updateData.lotType = body.lotType;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.category !== undefined) updateData.category = body.category || null;
    if (body.condition !== undefined) updateData.condition = body.condition || null;
    if (body.askingPrice !== undefined) updateData.askingPrice = body.askingPrice;
    if (body.weight !== undefined) updateData.weight = body.weight;
    if (body.retailValue !== undefined) updateData.retailValue = body.retailValue;
    if (body.costBasis !== undefined) updateData.costBasis = body.costBasis;
    if (body.manifestGenerated !== undefined)
      updateData.manifestGenerated = body.manifestGenerated;
    if (body.manifestUrl !== undefined) updateData.manifestUrl = body.manifestUrl;

    const lot = await prisma.lot.update({
      where: { id },
      data: updateData,
      include: {
        warehouse: { select: { name: true, code: true } },
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json({ lot });
  } catch (error) {
    console.error("[LIQOS] PUT /lots/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update lot" },
      { status: 500 }
    );
  }
}
