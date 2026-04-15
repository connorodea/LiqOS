"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PackageOpen,
  ClipboardCheck,
  FileSpreadsheet,
  Boxes,
  ShoppingCart,
  Package,
  Truck,
  RotateCcw,
  Wrench,
  Camera,
  Tags,
  BarChart3,
  Users,
  Plug,
  Workflow,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_MODULES = [
  { label: "Dashboard", href: "/liqos", icon: LayoutDashboard },
  { label: "Receiving", href: "/liqos/receiving", icon: PackageOpen },
  { label: "Testing & Grading", href: "/liqos/inventory", icon: ClipboardCheck },
  { label: "Manifests", href: "/liqos/manifests", icon: FileSpreadsheet },
  { label: "Lot Builder", href: "/liqos/lots", icon: Boxes },
  { label: "Listings", href: "/liqos/listings", icon: ShoppingCart },
  { label: "Orders", href: "/liqos/orders", icon: Package },
  { label: "Shipping", href: "/liqos/shipments", icon: Truck },
  { label: "Returns", href: "/liqos/returns", icon: RotateCcw },
  { label: "Refurbishment", href: "/liqos/refurbishment", icon: Wrench },
  { label: "Photos", href: "/liqos/photos", icon: Camera },
  { label: "Labels", href: "/liqos/labels", icon: Tags },
  { label: "Analytics", href: "/liqos/analytics", icon: BarChart3 },
  { label: "Users & Roles", href: "/liqos/users", icon: Users },
  { label: "API", href: "/liqos/api", icon: Plug },
  { label: "Workflows", href: "/liqos/workflows", icon: Workflow },
] as const;

export function LiqOSSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/liqos") return pathname === "/liqos";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center gap-2 px-4 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black font-bold text-sm">
          L
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          LiqOS
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_MODULES.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/8 hover:text-white/90"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="text-xs text-white/40">
          Upscaled Distribution
        </div>
        <div className="text-xs text-white/25 mt-0.5">
          LiqOS v1.0
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background lg:hidden"
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-[oklch(0.13_0_0)] transition-transform duration-200 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
