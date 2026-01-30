"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import useSWR, { mutate } from "swr"
import { IconPlus, IconRefresh } from "@tabler/icons-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { apiClient, type Shipment, type PaginatedResponse } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

const fetcher = <T,>(path: string) => apiClient<T>(path)

export default function ShipmentsPage() {
  const searchParams = useSearchParams()
  const prefillOrderId = searchParams.get("order_id") || ""

  const { data, isLoading, error } = useSWR<PaginatedResponse<Shipment>>(
    "/logistics/shipments?since=30d",
    fetcher
  )
  const [createModalOpen, setCreateModalOpen] = React.useState(!!prefillOrderId)
  const [formData, setFormData] = React.useState({
    order_id: prefillOrderId,
    carrier: "",
    service: "",
  })
  const [submitting, setSubmitting] = React.useState(false)
  const [syncing, setSyncing] = React.useState(false)

  const handleCreateLabel = async () => {
    setSubmitting(true)
    try {
      const result = await apiClient<{
        shipment_id: string
        tracking_number: string | null
        label_url: string | null
        trace_id: string
      }>("/logistics/labels", {
        method: "POST",
        body: formData,
      })
      toast.success(`Label created: ${result.tracking_number || result.shipment_id}`, {
        description: `Trace: ${result.trace_id}`,
      })
      setCreateModalOpen(false)
      setFormData({ order_id: "", carrier: "", service: "" })
      mutate("/logistics/shipments?since=30d")
    } catch (error) {
      toast.error("Failed to create label", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSyncTracking = async () => {
    setSyncing(true)
    try {
      const result = await apiClient<{ updated: number; trace_id: string }>(
        "/logistics/tracking/sync",
        { method: "POST", body: {} }
      )
      toast.success(`Updated ${result.updated} tracking statuses`, {
        description: `Trace: ${result.trace_id}`,
      })
      mutate("/logistics/shipments?since=30d")
    } catch (error) {
      toast.error("Failed to sync tracking", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter by Order ID..."
            className="w-[200px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSyncTracking} disabled={syncing}>
            {syncing ? (
              <IconRefresh className="mr-2 size-4 animate-spin" />
            ) : (
              <IconRefresh className="mr-2 size-4" />
            )}
            Sync Tracking
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <IconPlus className="mr-2 size-4" />
            Create Label
          </Button>
        </div>
      </div>

      {/* Shipments Table */}
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
              Failed to load shipments
            </div>
          ) : data?.items && data.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((shipment) => (
                  <TableRow key={shipment.shipment_id}>
                    <TableCell className="font-mono text-sm">
                      {shipment.shipment_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {shipment.order_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{shipment.carrier || "-"}</TableCell>
                    <TableCell>{shipment.service || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {shipment.tracking_number ? (
                        <a
                          href={`https://track.aftership.com/${shipment.tracking_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {shipment.tracking_number}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <ShipmentStatusBadge status={shipment.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No shipments found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Label Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Shipping Label</DialogTitle>
            <DialogDescription>
              Generate a shipping label for an order.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="order_id">Order ID</Label>
              <Input
                id="order_id"
                value={formData.order_id}
                onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                placeholder="ord_..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier (optional)</Label>
                <Input
                  id="carrier"
                  value={formData.carrier}
                  onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                  placeholder="USPS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">Service (optional)</Label>
                <Input
                  id="service"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  placeholder="Priority"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLabel} disabled={submitting || !formData.order_id}>
              {submitting && <IconRefresh className="mr-2 size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ShipmentStatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    delivered: "default",
    in_transit: "secondary",
    pending: "outline",
    exception: "destructive",
    returned: "destructive",
  }

  return (
    <Badge variant={variants[status] || "outline"}>
      {status.replace(/_/g, " ")}
    </Badge>
  )
}
