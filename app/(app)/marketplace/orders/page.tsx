"use client"

import * as React from "react"
import useSWR, { mutate } from "swr"
import { IconDownload, IconRefresh, IconTruck } from "@tabler/icons-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { apiClient, type Order, type PaginatedResponse } from "@/lib/api"
import { formatDistanceToNow, format } from "date-fns"
import Link from "next/link"

const fetcher = <T,>(path: string) => apiClient<T>(path)

export default function OrdersPage() {
  const [channel, setChannel] = React.useState("ebay")
  const [status, setStatus] = React.useState("any")
  const [pulling, setPulling] = React.useState(false)

  const { data, isLoading, error } = useSWR<PaginatedResponse<Order>>(
    `/marketplace/orders?channel=${channel}${status ? `&status=${status}` : ""}&since=30d`,
    fetcher
  )

  const handlePullOrders = async () => {
    setPulling(true)
    try {
      const result = await apiClient<{ imported: number; updated: number; trace_id: string }>(
        "/marketplace/orders/pull",
        {
          method: "POST",
          body: { channel, since: "7d" },
        }
      )
      toast.success(`Imported ${result.imported}, Updated ${result.updated}`, {
        description: `Trace: ${result.trace_id}`,
      })
      mutate(`/marketplace/orders?channel=${channel}${status ? `&status=${status}` : ""}&since=30d`)
    } catch (error) {
      toast.error("Failed to pull orders", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setPulling(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="channel" className="text-sm text-muted-foreground">
              Channel
            </Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ebay">eBay</SelectItem>
                <SelectItem value="shopify">Shopify</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="status" className="text-sm text-muted-foreground">
              Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handlePullOrders} disabled={pulling}>
          {pulling ? (
            <IconRefresh className="mr-2 size-4 animate-spin" />
          ) : (
            <IconDownload className="mr-2 size-4" />
          )}
          Pull Orders
        </Button>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Failed to load orders
            </div>
          ) : data?.items && data.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Cur</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((order) => (
                  <TableRow key={order.order_id}>
                    <TableCell className="font-mono text-sm">
                      {order.external_order_id}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {order.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.currency}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/marketplace/orders/${order.order_id}`}>
                            Open
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/logistics/shipments?order_id=${order.order_id}`}>
                            <IconTruck className="mr-1 size-4" />
                            Label
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No orders found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function OrderStatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    fulfilled: "default",
    shipped: "default",
    unfulfilled: "secondary",
    pending: "secondary",
    cancelled: "destructive",
    refunded: "destructive",
  }

  return (
    <Badge variant={variants[status] || "outline"}>
      {status}
    </Badge>
  )
}
