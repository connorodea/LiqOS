"use client"

import * as React from "react"
import useSWR, { mutate } from "swr"
import { IconRefresh, IconCreditCard } from "@tabler/icons-react"
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
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { apiClient, type FinancialTransaction, type PaginatedResponse } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

const fetcher = <T,>(path: string) => apiClient<T>(path)

export default function FinanceReconcilePage() {
  const [range, setRange] = React.useState("30d")
  const [reconciling, setReconciling] = React.useState(false)

  const { data, isLoading, error } = useSWR<PaginatedResponse<FinancialTransaction>>(
    "/finance/transactions?since=30d&limit=50",
    fetcher
  )

  const handleReconcile = async () => {
    setReconciling(true)
    try {
      const result = await apiClient<{ imported: number; trace_id: string }>(
        "/finance/reconcile/stripe",
        { method: "POST", body: { since: range } }
      )
      toast.success(`Imported ${result.imported} transactions`, {
        description: `Trace: ${result.trace_id}`,
      })
      mutate("/finance/transactions?since=30d&limit=50")
    } catch (error) {
      toast.error("Reconciliation failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setReconciling(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Stripe Reconciliation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCreditCard className="size-5" />
            Stripe Reconciliation
          </CardTitle>
          <CardDescription>
            Import payouts/transactions into ledger
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="range">Range</Label>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7d</SelectItem>
                  <SelectItem value="30d">30d</SelectItem>
                  <SelectItem value="90d">90d</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleReconcile} disabled={reconciling}>
              {reconciling && <IconRefresh className="mr-2 size-4 animate-spin" />}
              Run Reconcile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Normalized ledger entries</CardDescription>
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
              Failed to load transactions
            </div>
          ) : data?.items && data.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Time</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Cur</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((txn) => (
                  <TableRow key={txn.txn_id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(txn.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{txn.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <TxnTypeBadge type={txn.type} />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={txn.amount >= 0 ? "text-emerald-600" : "text-red-600"}>
                        {txn.amount >= 0 ? "+" : ""}
                        {txn.amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {txn.currency}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {txn.reference?.slice(0, 20) || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No transactions found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TxnTypeBadge({ type }: { type: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    payout: "default",
    charge: "secondary",
    refund: "destructive",
    fee: "outline",
  }

  return (
    <Badge variant={variants[type] || "outline"}>
      {type}
    </Badge>
  )
}
