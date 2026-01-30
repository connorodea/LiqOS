"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const environments = [
  { value: "dev", label: "Development", color: "bg-blue-500" },
  { value: "staging", label: "Staging", color: "bg-amber-500" },
  { value: "prod", label: "Production", color: "bg-emerald-500" },
]

export function EnvSwitcher() {
  const [env, setEnv] = React.useState("dev")

  React.useEffect(() => {
    const stored = localStorage.getItem("upscaled-env")
    if (stored) setEnv(stored)
  }, [])

  const handleChange = (value: string) => {
    setEnv(value)
    localStorage.setItem("upscaled-env", value)
  }

  const current = environments.find((e) => e.value === env)

  return (
    <Select value={env} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-[130px] text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${current?.color || "bg-muted"}`}
          />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {environments.map((e) => (
          <SelectItem key={e.value} value={e.value}>
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${e.color}`} />
              {e.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
