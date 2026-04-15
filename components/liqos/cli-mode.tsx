"use client";

import { useState, useRef, useEffect } from "react";
import { Terminal, X } from "lucide-react";

interface CommandResult {
  command: string;
  output: string;
  timestamp: Date;
  isError?: boolean;
}

const HELP_TEXT = `LiqOS CLI v0.2 — Available Commands:

  INVENTORY
    list items [--status=X] [--grade=X]    List inventory items
    get item <SKU>                          Get item details
    grade <SKU> <GRADE>                     Set item grade (LN/VG/G/PO/SA)
    
  RECEIVING
    list receivings                         List all receivings
    new receiving <supplier>                Create new receiving
    
  LOTS
    list lots [--status=X]                  List all lots
    new lot <name> <type>                   Create new lot (PALLET/TRUCKLOAD/BOX)
    add-to-lot <LOT#> <SKU>                Add item to lot
    manifest <LOT#>                         Generate manifest
    
  SHIPPING
    list shipments                          List shipments
    track <SHIPMENT#>                       Track a shipment
    
  REFURBISHMENT
    list refurb [--status=X]               List refurb jobs
    queue <SKU>                             Queue item for refurbishment
    
  ANALYTICS
    stats                                   Show dashboard stats
    grades                                  Show grade distribution
    
  SYSTEM
    help                                    Show this help
    clear                                   Clear terminal
    whoami                                  Show current user
    version                                 Show LiqOS version
`;

export function CLIMode({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<CommandResult[]>([
    { command: "", output: "LiqOS CLI v0.2 — Type 'help' for available commands.", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [history]);

  async function executeCommand(cmd: string) {
    const trimmed = cmd.trim().toLowerCase();
    if (!trimmed) return;

    if (trimmed === "clear") {
      setHistory([]);
      return;
    }

    if (trimmed === "help") {
      setHistory((h) => [...h, { command: cmd, output: HELP_TEXT, timestamp: new Date() }]);
      return;
    }

    if (trimmed === "version") {
      setHistory((h) => [...h, { command: cmd, output: "LiqOS v0.2.0 — Liquidation Operating System\nBuilt with Next.js 16 + Prisma 6 + PostgreSQL", timestamp: new Date() }]);
      return;
    }

    if (trimmed === "whoami") {
      setHistory((h) => [...h, { command: cmd, output: "admin@liqos.upscaledist.com (ADMIN)", timestamp: new Date() }]);
      return;
    }

    // API-backed commands
    setLoading(true);
    try {
      let output = "";

      if (trimmed === "stats" || trimmed === "analytics stats") {
        const res = await fetch("/api/liqos/analytics");
        const data = await res.json();
        output = `Dashboard Stats:
  Total Items:     ${data.totalItems || 0}
  In Testing:      ${data.itemsByStatus?.TESTING || 0}
  Graded:          ${data.itemsByStatus?.GRADED || 0}
  In Lots:         ${data.itemsByStatus?.IN_LOT || 0}
  Listed:          ${data.itemsByStatus?.LISTED || 0}
  Sold:            ${data.itemsByStatus?.SOLD || 0}
  Total Lots:      ${data.totalLots || 0}
  Active Listings: ${data.totalListings || 0}
  Refurb Queue:    ${data.totalRefurbJobs || 0}`;
      } else if (trimmed.startsWith("list items") || trimmed.startsWith("list inventory")) {
        const params = new URLSearchParams();
        const statusMatch = trimmed.match(/--status=(\w+)/);
        const gradeMatch = trimmed.match(/--grade=(\w+)/);
        if (statusMatch) params.set("status", statusMatch[1].toUpperCase());
        if (gradeMatch) params.set("grade", gradeMatch[1].toUpperCase());
        params.set("limit", "20");

        const res = await fetch("/api/liqos/inventory?" + params.toString());
        const data = await res.json();
        if (data.items?.length) {
          output = `${data.total} items found (showing ${data.items.length}):\n\n`;
          output += "SKU             | Name                           | Grade  | Status\n";
          output += "----------------|--------------------------------|--------|----------\n";
          data.items.forEach((item: { sku: string; name: string; grade: string; status: string }) => {
            output += `${item.sku.padEnd(16)}| ${item.name.substring(0, 30).padEnd(31)}| ${item.grade.padEnd(7)}| ${item.status}\n`;
          });
        } else {
          output = "No items found.";
        }
      } else if (trimmed.startsWith("list lots")) {
        const res = await fetch("/api/liqos/lots");
        const data = await res.json();
        if (data.length) {
          output = `${data.length} lots:\n\n`;
          output += "LOT#         | Name                      | Type      | Status    | Items\n";
          output += "-------------|---------------------------|-----------|-----------|------\n";
          data.forEach((lot: { lotNumber: string; name: string; lotType: string; status: string; _count?: { items: number } }) => {
            output += `${lot.lotNumber.padEnd(13)}| ${lot.name.substring(0, 25).padEnd(26)}| ${lot.lotType.padEnd(10)}| ${lot.status.padEnd(10)}| ${lot._count?.items || 0}\n`;
          });
        } else {
          output = "No lots found.";
        }
      } else if (trimmed.startsWith("list receivings")) {
        const res = await fetch("/api/liqos/receivings");
        const data = await res.json();
        if (data.length) {
          output = `${data.length} receivings:\n\n`;
          data.forEach((r: { receiptNumber: string; supplier: string; status: string; receivedUnits: number }) => {
            output += `${r.receiptNumber}  ${(r.supplier || "N/A").padEnd(20)}  ${r.status.padEnd(12)}  ${r.receivedUnits} units\n`;
          });
        } else {
          output = "No receivings found.";
        }
      } else if (trimmed.startsWith("list refurb")) {
        const res = await fetch("/api/liqos/refurbishment");
        const data = await res.json();
        if (data.length) {
          output = `${data.length} refurbishment jobs:\n\n`;
          data.forEach((j: { status: string; inventoryItem: { sku: string; name: string }; assignedTo: string }) => {
            output += `${j.inventoryItem.sku.padEnd(16)}  ${j.inventoryItem.name.substring(0, 30).padEnd(31)}  ${j.status.padEnd(12)}  ${j.assignedTo || "unassigned"}\n`;
          });
        } else {
          output = "No refurbishment jobs found.";
        }
      } else if (trimmed.startsWith("list shipments")) {
        const res = await fetch("/api/liqos/shipments");
        const data = await res.json();
        if (data.length) {
          output = `${data.length} shipments:\n\n`;
          data.forEach((s: { shipmentNumber: string; carrier: string; status: string; trackingNumber: string }) => {
            output += `${s.shipmentNumber}  ${(s.carrier || "N/A").padEnd(12)}  ${s.status.padEnd(14)}  ${s.trackingNumber || "no tracking"}\n`;
          });
        } else {
          output = "No shipments found.";
        }
      } else {
        output = `Unknown command: ${cmd}\nType 'help' for available commands.`;
      }

      setHistory((h) => [...h, { command: cmd, output, timestamp: new Date() }]);
    } catch {
      setHistory((h) => [...h, { command: cmd, output: "Error executing command.", timestamp: new Date(), isError: true }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !loading) {
      executeCommand(input);
      setInput("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black text-green-400 font-mono text-sm flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <span className="text-xs font-bold">LiqOS CLI</span>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Terminal output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {history.map((entry, i) => (
          <div key={i}>
            {entry.command && (
              <div className="flex gap-2">
                <span className="text-green-500">liqos $</span>
                <span className="text-white">{entry.command}</span>
              </div>
            )}
            <pre className={`whitespace-pre-wrap text-xs leading-relaxed ${entry.isError ? "text-red-400" : "text-zinc-300"}`}>
              {entry.output}
            </pre>
          </div>
        ))}
        {loading && (
          <div className="text-yellow-400 animate-pulse">Processing...</div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-t border-zinc-700">
        <span className="text-green-500">liqos $</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-white outline-none"
          placeholder="Type a command..."
          disabled={loading}
          autoFocus
        />
      </div>
    </div>
  );
}
