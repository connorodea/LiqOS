"use client"

import * as React from "react"
import useSWR from "swr"
import { IconActivity, IconRefresh } from "@tabler/icons-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient, type HealthCheck } from "@/lib/api"

interface HealthResponse {
  status: string
  checks: HealthCheck[]
  trace_id: string
}

const fetcher = <T,>(path: string) => apiClient<T>(path)

export default function MonitorHealthPage() {
  const { data, isLoading, error, mutate } = useSWR<HealthResponse>(
    "/monitor/health",
    fetcher
  )
  const [refreshing, setRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await mutate()
    setRefreshing(false)
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconActivity className="size-5" />
                System Health
              </CardTitle>
              <CardDescription>
                Providers, DB, queues, and core services
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <IconRefresh className="mr-2 size-4 animate-spin" />
              ) : (
                <IconRefresh className="mr-2 size-4" />
              )}
              Run Health Check
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Failed to load health status
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Overall:</span>
                <HealthStatusBadge status={data.status} size="lg" />
                {data.trace_id && (
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    Trace: {data.trace_id.slice(0, 12)}...
                  </span>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Check</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Latency (ms)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.checks.map((check) => (
                    <TableRow key={check.name}>
                      <TableCell className="font-medium">{check.name}</TableCell>
                      <TableCell>
                        <HealthStatusBadge status={check.status} />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {check.latency_ms !== null ? check.latency_ms : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No health data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function HealthStatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "lg" }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    healthy: "default",
    ok: "default",
    degraded: "secondary",
    unhealthy: "destructive",
    error: "destructive",
    unknown: "outline",
  }

  return (
    <Badge
      variant={variants[status] || "outline"}
      className={size === "lg" ? "px-3 py-1" : ""}
    >
      {status}
    </Badge>
  )
}
