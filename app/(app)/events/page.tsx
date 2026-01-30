"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react"
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient, type Event, type PaginatedResponse } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

const fetcher = <T,>(path: string) => apiClient<T>(path)

export default function EventsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [traceId, setTraceId] = React.useState(searchParams.get("trace_id") || "")
  const [entityId, setEntityId] = React.useState(searchParams.get("entity_id") || "")
  const [eventType, setEventType] = React.useState(searchParams.get("event_type") || "")
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())

  // Build query string
  const buildQuery = () => {
    const params = new URLSearchParams()
    if (traceId) params.set("trace_id", traceId)
    if (entityId) params.set("entity_id", entityId)
    if (eventType) params.set("event_type", eventType)
    params.set("since", "7d")
    params.set("limit", "100")
    return params.toString()
  }

  const { data, isLoading, error } = useSWR<PaginatedResponse<Event>>(
    `/events?${buildQuery()}`,
    fetcher
  )

  const toggleRow = (eventId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(eventId)) {
        next.delete(eventId)
      } else {
        next.add(eventId)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-2">
            <Label htmlFor="trace_id" className="text-xs text-muted-foreground">
              Trace ID
            </Label>
            <Input
              id="trace_id"
              value={traceId}
              onChange={(e) => setTraceId(e.target.value)}
              placeholder="optional"
              className="w-[180px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entity_id" className="text-xs text-muted-foreground">
              Entity ID
            </Label>
            <Input
              id="entity_id"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="optional"
              className="w-[180px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event_type" className="text-xs text-muted-foreground">
              Event Type
            </Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="command_success">command_success</SelectItem>
                <SelectItem value="command_failure">command_failure</SelectItem>
                <SelectItem value="resource_created">resource_created</SelectItem>
                <SelectItem value="resource_updated">resource_updated</SelectItem>
                <SelectItem value="resource_deleted">resource_deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Failed to load events
            </div>
          ) : data?.items && data.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead className="w-[140px]">Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Trace</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((event) => (
                  <React.Fragment key={event.event_id}>
                    <TableRow className="cursor-pointer" onClick={() => toggleRow(event.event_id)}>
                      <TableCell className="w-8 p-2">
                        <Button variant="ghost" size="icon" className="size-6">
                          {expandedRows.has(event.event_id) ? (
                            <IconChevronDown className="size-4" />
                          ) : (
                            <IconChevronRight className="size-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <EventTypeBadge type={event.event_type} />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {event.entity_type}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {event.entity_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {event.trace_id.slice(0, 12)}...
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(event.event_id) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/50 p-4">
                          <pre className="overflow-auto rounded bg-background p-3 text-xs">
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No events found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function EventTypeBadge({ type }: { type: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    command_success: "default",
    command_failure: "destructive",
    resource_created: "secondary",
    resource_updated: "outline",
    resource_deleted: "destructive",
  }

  return (
    <Badge variant={variants[type] || "outline"} className="font-mono text-xs">
      {type.replace(/_/g, " ")}
    </Badge>
  )
}
