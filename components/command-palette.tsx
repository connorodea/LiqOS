"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconActivity,
  IconBox,
  IconCloud,
  IconCreditCard,
  IconLayoutDashboard,
  IconMegaphone,
  IconPlug,
  IconScrollText,
  IconSettings,
  IconShoppingCart,
  IconTruck,
  IconRefresh,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: IconLayoutDashboard },
  { label: "Providers", href: "/providers", icon: IconPlug },
  { label: "Cloud Servers", href: "/cloud/servers", icon: IconCloud },
  { label: "Marketplace Orders", href: "/marketplace/orders", icon: IconShoppingCart },
  { label: "Logistics Shipments", href: "/logistics/shipments", icon: IconTruck },
  { label: "Warehouse Intake", href: "/warehouse/intake", icon: IconBox },
  { label: "Finance Reconcile", href: "/finance/reconcile", icon: IconCreditCard },
  { label: "Growth Outreach", href: "/growth/outreach", icon: IconMegaphone },
  { label: "Monitor Health", href: "/monitor/health", icon: IconActivity },
  { label: "Events Log", href: "/events", icon: IconScrollText },
  { label: "Admin Settings", href: "/admin/settings", icon: IconSettings },
]

const quickActions = [
  {
    label: "Pull Orders (eBay)",
    action: async () => {
      const result = await apiClient<{ imported: number; updated: number; trace_id: string }>(
        "/marketplace/orders/pull",
        { method: "POST", body: { channel: "ebay", since: "7d" } }
      )
      toast.success(`Imported ${result.imported}, Updated ${result.updated}`, {
        description: `Trace: ${result.trace_id}`,
      })
    },
  },
  {
    label: "Sync Tracking",
    action: async () => {
      const result = await apiClient<{ updated: number; trace_id: string }>(
        "/logistics/tracking/sync",
        { method: "POST", body: {} }
      )
      toast.success(`Updated ${result.updated} tracking statuses`, {
        description: `Trace: ${result.trace_id}`,
      })
    },
  },
  {
    label: "Run Health Check",
    action: async () => {
      const result = await apiClient<{ status: string; trace_id: string }>(
        "/monitor/health",
        { method: "GET" }
      )
      toast.success(`System status: ${result.status}`, {
        description: `Trace: ${result.trace_id}`,
      })
    },
  },
  {
    label: "Reconcile Stripe (30d)",
    action: async () => {
      const result = await apiClient<{ imported: number; trace_id: string }>(
        "/finance/reconcile/stripe",
        { method: "POST", body: { since: "30d" } }
      )
      toast.success(`Imported ${result.imported} transactions`, {
        description: `Trace: ${result.trace_id}`,
      })
    },
  },
]

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runAction = async (action: () => Promise<void>) => {
    setOpen(false)
    try {
      await action()
    } catch (error) {
      toast.error("Action failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-2 text-xs text-muted-foreground bg-transparent"
        onClick={() => setOpen(true)}
      >
        <span className="hidden sm:inline">Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages or run actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {navigationItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  router.push(item.href)
                  setOpen(false)
                }}
              >
                <item.icon className="mr-2 size-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            {quickActions.map((item) => (
              <CommandItem
                key={item.label}
                onSelect={() => runAction(item.action)}
              >
                <IconRefresh className="mr-2 size-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
