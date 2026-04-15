"use client";

import { useState } from "react";
import { Upload, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublishToStoreButton({ lotId, isPublished }: { lotId: string; isPublished: boolean }) {
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(isPublished);

  async function handlePublish() {
    setLoading(true);
    try {
      const res = await fetch("/api/liqos/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lotId }),
      });
      const data = await res.json();
      if (data.success || data.storeProductId) {
        setPublished(true);
      }
    } catch {
      // Silent fail — will retry
    } finally {
      setLoading(false);
    }
  }

  if (published) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <CheckCircle className="h-3 w-3" /> Published
      </span>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handlePublish} disabled={loading} className="gap-1 text-xs">
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
      Publish to Store
    </Button>
  );
}
