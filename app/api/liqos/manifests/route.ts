import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const lotId = request.nextUrl.searchParams.get("lotId");
  if (!lotId) return NextResponse.json({ error: "lotId required" }, { status: 400 });

  const lot = await prisma.lot.findUnique({
    where: { id: lotId },
    include: { items: { orderBy: { sku: "asc" } }, warehouse: true },
  });

  if (!lot) return NextResponse.json({ error: "Lot not found" }, { status: 404 });

  const headers = ["Line#","SKU","Name","Brand","Model","UPC","Category","Condition","Grade","Retail Price"];
  const rows = lot.items.map((item, i) => [
    i + 1, item.sku, `"${item.name}"`, item.brand || "", item.model || "",
    item.upc || "", item.category || "", item.condition || "", item.grade,
    item.retailPrice ? Number(item.retailPrice).toFixed(2) : "",
  ].join(","));

  const csv = [headers.join(","), ...rows].join("\n");

  await prisma.lot.update({ where: { id: lotId }, data: { manifestGenerated: true } });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="manifest-${lot.lotNumber}.csv"`,
    },
  });
}
