"use client"

import * as React from "react"
import useSWR, { mutate } from "swr"
import { IconKey, IconLogout, IconRefresh } from "@tabler/icons-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { apiClient, type Provider } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

const fetcher = <T,>(path: string) => apiClient<T>(path)

export default function ProvidersPage() {
  const { data, isLoading, error } = useSWR<{ providers: Provider[] }>(
    "/auth/providers",
    fetcher
  )
  const [loginModalOpen, setLoginModalOpen] = React.useState(false)
  const [selectedProvider, setSelectedProvider] = React.useState<string | null>(null)
  const [token, setToken] = React.useState("")
  const [loginLoading, setLoginLoading] = React.useState(false)

  const handleLogin = (provider: string) => {
    setSelectedProvider(provider)
    setToken("")
    setLoginModalOpen(true)
  }

  const handleLogout = async (provider: string) => {
    try {
      await apiClient(`/auth/logout/${provider}`, { method: "POST" })
      toast.success(`Logged out of ${provider}`)
      mutate("/auth/providers")
    } catch (error) {
      toast.error("Logout failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleSubmitLogin = async () => {
    if (!selectedProvider) return
    setLoginLoading(true)
    try {
      await apiClient(`/auth/login/${selectedProvider}`, {
        method: "POST",
        body: { mode: "token", token },
      })
      toast.success(`Connected to ${selectedProvider}`)
      setLoginModalOpen(false)
      mutate("/auth/providers")
    } catch (error) {
      toast.error("Login failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Provider Connections</CardTitle>
          <CardDescription>
            Authenticate APIs and verify status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Failed to load providers
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.providers.map((provider) => (
                  <TableRow key={provider.provider}>
                    <TableCell className="font-medium capitalize">
                      {provider.provider}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={provider.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {provider.expires_at
                        ? formatDistanceToNow(new Date(provider.expires_at), {
                            addSuffix: true,
                          })
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {provider.last_checked_at
                        ? formatDistanceToNow(new Date(provider.last_checked_at), {
                            addSuffix: true,
                          })
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLogin(provider.provider)}
                        >
                          <IconKey className="mr-1 size-4" />
                          Login
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLogout(provider.provider)}
                          disabled={provider.status === "disconnected"}
                        >
                          <IconLogout className="mr-1 size-4" />
                          Logout
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {selectedProvider}</DialogTitle>
            <DialogDescription>
              Enter credentials to connect this provider.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="token" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="token" className="flex-1">
                Token
              </TabsTrigger>
              <TabsTrigger value="oauth" className="flex-1">
                OAuth
              </TabsTrigger>
            </TabsList>
            <TabsContent value="token" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">API Token / Key</Label>
                <Textarea
                  id="token"
                  placeholder="Paste token here..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  rows={4}
                />
              </div>
            </TabsContent>
            <TabsContent value="oauth" className="mt-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  For OAuth providers, you{"'"}ll be redirected or provided a
                  device code flow.
                </p>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitLogin} disabled={loginLoading}>
              {loginLoading && <IconRefresh className="mr-2 size-4 animate-spin" />}
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    connected: "default",
    active: "default",
    disconnected: "secondary",
    expired: "destructive",
    error: "destructive",
  }

  return (
    <Badge variant={variants[status] || "outline"}>
      {status}
    </Badge>
  )
}
