"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "@tabler/icons-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: IconLayoutDashboard },
  { label: "Providers", href: "/providers", icon: IconPlug },
  { label: "Cloud", href: "/cloud/servers", icon: IconCloud },
  { label: "Marketplace", href: "/marketplace/orders", icon: IconShoppingCart },
  { label: "Logistics", href: "/logistics/shipments", icon: IconTruck },
  { label: "Warehouse", href: "/warehouse/intake", icon: IconBox },
  { label: "Finance", href: "/finance/reconcile", icon: IconCreditCard },
  { label: "Growth", href: "/growth/outreach", icon: IconMegaphone },
  { label: "Monitor", href: "/monitor/health", icon: IconActivity },
  { label: "Events", href: "/events", icon: IconScrollText },
  { label: "Admin", href: "/admin/settings", icon: IconSettings },
]

const user = {
  name: "Operator",
  email: "ops@upscaled.io",
  avatar: "",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <div className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground">
                  <span className="text-xs font-bold">U</span>
                </div>
                <span className="text-base font-semibold">Upscaled</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      className={cn(isActive && "bg-sidebar-accent")}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
