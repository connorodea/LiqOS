import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const listings = await prisma.listing.findMany({
    where: { status: "SOLD" },
    orderBy: { soldAt: "desc" },
    include: { inventoryItem: { select: { sku: true, name: true } } },
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">Manage orders from all sales channels</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Orders", value: listings.length.toString() },
          { label: "Pending Fulfillment", value: listings.filter(l => !l.soldAt).length.toString() },
          { label: "Revenue", value: "$" + listings.reduce((s, l) => s + Number(l.price) * l.quantity, 0).toLocaleString() },
          { label: "Channels", value: [...new Set(listings.map(l => l.channel))].length.toString() },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border p-4">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left font-medium">Item SKU</th>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Channel</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-left font-medium">Sold</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-xs">{listing.inventoryItem.sku}</td>
                <td className="px-4 py-3">{listing.title}</td>
                <td className="px-4 py-3"><Badge variant="outline">{listing.channel}</Badge></td>
                <td className="px-4 py-3 text-right font-medium">${Number(listing.price).toLocaleString()}</td>
                <td className="px-4 py-3 text-muted-foreground">{listing.soldAt ? new Date(listing.soldAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {listings.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No orders yet. Items will appear here when sold through listings.
          </div>
        )}
      </div>
    </div>
  );
}
