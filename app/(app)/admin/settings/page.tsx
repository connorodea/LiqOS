"use client"

import * as React from "react"
import useSWR, { mutate } from "swr"
import { IconPlus, IconRefresh, IconTrash } from "@tabler/icons-react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { apiClient } from "@/lib/api"

interface Plugin {
  name: string
  version: string
  status: string
}

interface PluginsResponse {
  plugins: Plugin[]
}

const fetcher = <T,>(path: string) => apiClient<T>(path)

export default function AdminSettingsPage() {
  const [env, setEnv] = React.useState("dev")
  const [addModalOpen, setAddModalOpen] = React.useState(false)
  const [deletePlugin, setDeletePlugin] = React.useState<Plugin | null>(null)
  const [pluginSource, setPluginSource] = React.useState("")
  const [installing, setInstalling] = React.useState(false)

  const { data, isLoading, error } = useSWR<PluginsResponse>(
    "/admin/plugins",
    fetcher
  )

  React.useEffect(() => {
    const stored = localStorage.getItem("upscaled-env")
    if (stored) setEnv(stored)
  }, [])

  const handleEnvChange = (value: string) => {
    setEnv(value)
    localStorage.setItem("upscaled-env", value)
    toast.success(`Environment set to ${value}`)
  }

  const handleInstallPlugin = async () => {
    if (!pluginSource) return
    setInstalling(true)
    try {
      await apiClient("/admin/plugins", {
        method: "POST",
        body: { source: pluginSource },
      })
      toast.success("Plugin installed")
      setAddModalOpen(false)
      setPluginSource("")
      mutate("/admin/plugins")
    } catch (error) {
      toast.error("Failed to install plugin", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setInstalling(false)
    }
  }

  const handleDeletePlugin = async () => {
    if (!deletePlugin) return
    try {
      await apiClient(`/admin/plugins/${deletePlugin.name}`, {
        method: "DELETE",
      })
      toast.success(`Removed ${deletePlugin.name}`)
      setDeletePlugin(null)
      mutate("/admin/plugins")
    } catch (error) {
      toast.error("Failed to remove plugin", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Environment */}
      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
          <CardDescription>
            Switch backend environment context
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="env">Active Environment</Label>
              <Select value={env} onValueChange={handleEnvChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dev">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-blue-500" />
                      Development
                    </div>
                  </SelectItem>
                  <SelectItem value="staging">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-amber-500" />
                      Staging
                    </div>
                  </SelectItem>
                  <SelectItem value="prod">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      Production
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Env is sent as X-Upscaled-Env on every request and controls
                configuration selection.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plugins */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Plugins</CardTitle>
            <CardDescription>Installed provider integrations</CardDescription>
          </div>
          <Button size="sm" onClick={() => setAddModalOpen(true)}>
            <IconPlus className="mr-2 size-4" />
            Add Plugin
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Failed to load plugins
            </div>
          ) : data?.plugins && data.plugins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.plugins.map((plugin) => (
                  <TableRow key={plugin.name}>
                    <TableCell className="font-medium">{plugin.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {plugin.version}
                    </TableCell>
                    <TableCell>
                      <PluginStatusBadge status={plugin.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletePlugin(plugin)}
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No plugins installed
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Plugin Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Plugin</DialogTitle>
            <DialogDescription>
              Install a new provider plugin from source.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plugin_source">Source</Label>
              <Input
                id="plugin_source"
                value={pluginSource}
                onChange={(e) => setPluginSource(e.target.value)}
                placeholder="git+https://... or local path"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInstallPlugin} disabled={installing || !pluginSource}>
              {installing && <IconRefresh className="mr-2 size-4 animate-spin" />}
              Install
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePlugin} onOpenChange={() => setDeletePlugin(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this plugin?</AlertDialogTitle>
            <AlertDialogDescription>
              This will uninstall {deletePlugin?.name}. You can reinstall it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlugin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PluginStatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    enabled: "default",
    disabled: "secondary",
    error: "destructive",
  }

  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
}
