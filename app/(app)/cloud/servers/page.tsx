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
import { apiClient, type Server, type PaginatedResponse } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

const fetcher = <T,>(path: string) => apiClient<T>(path)

export default function CloudServersPage() {
  const [provider, setProvider] = React.useState("hetzner")
  const { data, isLoading, error } = useSWR<PaginatedResponse<Server>>(
    `/cloud/servers?provider=${provider}`,
    fetcher
  )
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [deleteServer, setDeleteServer] = React.useState<Server | null>(null)
  const [formData, setFormData] = React.useState({
    name: "",
    type: "cpx31",
    region: "ash",
    image: "ubuntu-22.04",
    ssh_key: "",
  })
  const [submitting, setSubmitting] = React.useState(false)

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      const result = await apiClient<{ server_id: string; status: string }>(
        "/cloud/servers",
        {
          method: "POST",
          body: { provider, ...formData },
        }
      )
      toast.success(`Server created: ${result.server_id}`)
      setCreateModalOpen(false)
      setFormData({ name: "", type: "cpx31", region: "ash", image: "ubuntu-22.04", ssh_key: "" })
      mutate(`/cloud/servers?provider=${provider}`)
    } catch (error) {
      toast.error("Failed to create server", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReboot = async (server: Server) => {
    try {
      await apiClient(`/cloud/servers/${server.server_id}/reboot`, {
        method: "POST",
      })
      toast.success(`Rebooting ${server.name}`)
      mutate(`/cloud/servers?provider=${provider}`)
    } catch (error) {
      toast.error("Failed to reboot server", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteServer) return
    try {
      await apiClient(`/cloud/servers/${deleteServer.server_id}?force=true`, {
        method: "DELETE",
      })
      toast.success(`Deleted ${deleteServer.name}`)
      setDeleteServer(null)
      mutate(`/cloud/servers?provider=${provider}`)
    } catch (error) {
      toast.error("Failed to delete server", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="provider" className="sr-only">
            Provider
          </Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hetzner">Hetzner</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <IconPlus className="mr-2 size-4" />
          Create Server
        </Button>
      </div>

      {/* Servers Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Failed to load servers
            </div>
          ) : data?.items && data.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Server ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>IPv4</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((server) => (
                  <TableRow key={server.server_id}>
                    <TableCell className="font-medium">{server.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {server.server_id}
                    </TableCell>
                    <TableCell>{server.type}</TableCell>
                    <TableCell>{server.region}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {server.ipv4 || "-"}
                    </TableCell>
                    <TableCell>
                      <ServerStatusBadge status={server.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReboot(server)}
                        >
                          <IconRefresh className="mr-1 size-4" />
                          Reboot
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteServer(server)}
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No servers found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Server Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Server</DialogTitle>
            <DialogDescription>
              Provision a new server on {provider}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="my-server"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="cpx31"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="ash"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="ubuntu-22.04"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ssh_key">SSH Key (optional)</Label>
              <Input
                id="ssh_key"
                value={formData.ssh_key}
                onChange={(e) => setFormData({ ...formData, ssh_key: e.target.value })}
                placeholder="name-or-fingerprint"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting || !formData.name}>
              {submitting && <IconRefresh className="mr-2 size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteServer} onOpenChange={() => setDeleteServer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Destroy this server?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteServer?.name} ({deleteServer?.server_id}).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Destroy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ServerStatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    running: "default",
    starting: "secondary",
    stopping: "secondary",
    off: "outline",
    deleting: "destructive",
    error: "destructive",
  }

  return (
    <Badge variant={variants[status] || "outline"}>
      {status}
    </Badge>
  )
}
