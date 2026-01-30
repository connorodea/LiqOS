"use client"

import * as React from "react"
import useSWR from "swr"
import { IconBarcode, IconBox, IconRefresh } from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { apiClient, type Event, type PaginatedResponse } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

const fetcher = <T,>(path: string) => apiClient<T>(path)

const conditions = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "used_good", label: "Used - Good" },
  { value: "used_fair", label: "Used - Fair" },
  { value: "salvage", label: "Salvage" },
  { value: "repair", label: "Repair" },
]

export default function WarehouseIntakePage() {
  const [lotId, setLotId] = React.useState("")
  const [barcode, setBarcode] = React.useState("")
  const [condition, setCondition] = React.useState("salvage")
  const [intakeStarted, setIntakeStarted] = React.useState(false)
  const [starting, setStarting] = React.useState(false)
  const [scanning, setScanning] = React.useState(false)

  const { data: eventsData, isLoading: eventsLoading, mutate: mutateEvents } = useSWR<PaginatedResponse<Event>>(
    "/events?event_type=resource_updated&entity_type=inventory_items&limit=25",
    fetcher
  )

  const handleStartIntake = async () => {
    if (!lotId) return
    setStarting(true)
    try {
      const result = await apiClient<{ lot_id: string; status: string; trace_id: string }>(
        "/warehouse/intake/start",
        { method: "POST", body: { lot_id: lotId } }
      )
      toast.success(`Intake started for lot ${result.lot_id}`, {
        description: `Trace: ${result.trace_id}`,
      })
      setIntakeStarted(true)
    } catch (error) {
      toast.error("Failed to start intake", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setStarting(false)
    }
  }

  const handleScan = async () => {
    if (!barcode) return
    setScanning(true)
    try {
      const result = await apiClient<{ item_id: string; status: string; trace_id: string }>(
        "/warehouse/intake/scan",
        { method: "POST", body: { barcode, condition } }
      )
      toast.success(`Item recorded: ${result.item_id}`, {
        description: `Trace: ${result.trace_id}`,
      })
      setBarcode("")
      mutateEvents()
    } catch (error) {
      toast.error("Failed to record scan", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setScanning(false)
    }
  }

  // Auto-focus barcode input
  const barcodeInputRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (intakeStarted && barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [intakeStarted])

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Start Intake & Scan Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBox className="size-5" />
              Start Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="lot_id">Lot ID</Label>
                <Input
                  id="lot_id"
                  value={lotId}
                  onChange={(e) => setLotId(e.target.value)}
                  placeholder="ML123..."
                  disabled={intakeStarted}
                />
              </div>
              <Button
                onClick={handleStartIntake}
                disabled={starting || !lotId || intakeStarted}
                className="w-full"
              >
                {starting && <IconRefresh className="mr-2 size-4 animate-spin" />}
                {intakeStarted ? "Intake Active" : "Start"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={!intakeStarted ? "opacity-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBarcode className="size-5" />
              Scan Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  ref={barcodeInputRef}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleScan()
                  }}
                  placeholder="Scan input..."
                  disabled={!intakeStarted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={condition}
                  onValueChange={setCondition}
                  disabled={!intakeStarted}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleScan}
                disabled={scanning || !barcode || !intakeStarted}
                className="w-full"
              >
                {scanning && <IconRefresh className="mr-2 size-4 animate-spin" />}
                Record Scan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>Audit trail from events</CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : eventsData?.items && eventsData.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Time</TableHead>
                  <TableHead>Item ID</TableHead>
                  <TableHead>Payload</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsData.items.map((event) => (
                  <TableRow key={event.event_id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {event.entity_id.slice(0, 12)}...
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-xs">
                        {JSON.stringify(event.payload).slice(0, 50)}...
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No recent scans
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
