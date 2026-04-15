import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET /api/liqos/analytics — Dashboard stats and metrics
export async function GET() {
  try {
    const [
      totalItems,
      itemsByStatus,
      itemsByGrade,
      totalLots,
      lotsByStatus,
      activeListings,
      soldListings,
      totalShipments,
      refurbJobs,
      recentActivity,
    ] = await Promise.all([
      prisma.inventoryItem.count(),

      prisma.inventoryItem.groupBy({
        by: ["status"],
        _count: true,
      }),

      prisma.inventoryItem.groupBy({
        by: ["grade"],
        _count: true,
      }),

      prisma.lot.count(),

      prisma.lot.groupBy({
        by: ["status"],
        _count: true,
      }),

      prisma.listing.count({ where: { status: "ACTIVE" } }),

      prisma.listing.aggregate({
        where: { status: "SOLD" },
        _count: true,
        _sum: { price: true },
      }),

      prisma.shipment.count(),

      prisma.refurbishmentJob.groupBy({
        by: ["status"],
        _count: true,
      }),

      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      overview: {
        totalItems,
        totalLots,
        activeListings,
        soldCount: soldListings._count,
        revenue: soldListings._sum.price
          ? Number(soldListings._sum.price)
          : 0,
        totalShipments,
      },
      breakdown: {
        itemsByStatus,
        itemsByGrade,
        lotsByStatus,
        refurbJobs,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("[LIQOS] GET /analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
