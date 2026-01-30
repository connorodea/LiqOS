"use client"

import * as React from "react"
import useSWR from "swr"
import {
  IconActivity,
  IconAlertTriangle,
  IconPackage,
  IconShoppingCart,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient, type Event, type PaginatedResponse } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

// Mock dashboard stats - in production these would come from aggregation endpoints
const mockStats = {
  orders_7d: 142,
  shipping_exceptions: 3,
  active_listings: 1847,
  health_status: "healthy",
}

const fetcher = <T,>(path: string) => apiClient<T>(path)

export default function DashboardPage() {
  const { data: eventsData, isLoading: eventsLoading } = useSWR<PaginatedResponse<Event>>(
    "/events?limit=20",
    fetcher
  )

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Orders (7d)"
          value={mockStats.orders_7d}
          icon={IconShoppingCart}
          trend="+12% from last week"
        />
        <StatCard
          title="Shipping Exceptions"
          value={mockStats.shipping_exceptions}
          icon={IconAlertTriangle}
          variant={mockStats.shipping_exceptions > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Active Listings"
          value={mockStats.active_listings.toLocaleString()}
          icon={IconPackage}
        />
        <StatCard
          title="System Health"
          value={mockStats.health_status}
          icon={IconActivity}
          variant={mockStats.health_status === "healthy" ? "success" : "warning"}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Recent events across the system</CardDescription>
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
                  <TableHead>Event</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="w-[200px]">Trace</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsData.items.map((event) => (
                  <TableRow key={event.event_id}>
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
                    <TableCell>
                      <Link
                        href={`/events?trace_id=${event.trace_id}`}
                        className="font-mono text-xs text-muted-foreground hover:text-foreground"
                      >
                        {event.trace_id.slice(0, 12)}...
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No recent events
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
}: {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: string
  variant?: "default" | "success" | "warning"
}) {
  const variantStyles = {
    default: "",
    success: "border-emerald-200 dark:border-emerald-900",
    warning: "border-amber-200 dark:border-amber-900",
  }

  const iconStyles = {
    default: "text-muted-foreground",
    success: "text-emerald-500",
    warning: "text-amber-500",
  }

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`size-4 ${iconStyles[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold capitalize">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">{trend}</p>
        )}
      </CardContent>
    </Card>
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
