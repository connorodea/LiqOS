"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { EnvSwitcher } from "@/components/env-switcher"
import { CommandPalette } from "@/components/command-palette"
import { UserMenu } from "@/components/user-menu"

const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  providers: "Providers",
  cloud: "Cloud",
  servers: "Servers",
  marketplace: "Marketplace",
  orders: "Orders",
  listings: "Listings",
  logistics: "Logistics",
  shipments: "Shipments",
  warehouse: "Warehouse",
  intake: "Intake",
  finance: "Finance",
  reconcile: "Reconcile",
  growth: "Growth",
  outreach: "Outreach",
  monitor: "Monitor",
  health: "Health",
  events: "Events",
  admin: "Admin",
  settings: "Settings",
}

export function SiteHeader() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  return (
    <header className="flex h-[--header-height] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[--header-height]">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1
              const href = "/" + segments.slice(0, index + 1).join("/")
              const label = pathLabels[segment] || segment

              return (
                <BreadcrumbItem key={href}>
                  {!isLast ? (
                    <>
                      <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  ) : (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <EnvSwitcher />
          <CommandPalette />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
