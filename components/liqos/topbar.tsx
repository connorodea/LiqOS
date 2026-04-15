"use client";

import { useState } from "react";
import { Bell, Search, Terminal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CLIMode } from "./cli-mode";

export function LiqOSTopbar() {
  const [cliOpen, setCLIOpen] = useState(false);

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
        <div className="w-9 lg:hidden" />

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search items, lots, shipments..." className="pl-9 h-9" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* CLI toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCLIOpen(true)}
            title="Toggle CLI Mode (Ctrl+`)"
          >
            <Terminal className="size-4" />
          </Button>

          <Button variant="ghost" size="icon">
            <Bell className="size-4" />
          </Button>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background text-xs font-semibold">
            CO
          </div>
        </div>
      </header>

      {cliOpen && <CLIMode onClose={() => setCLIOpen(false)} />}
    </>
  );
}
