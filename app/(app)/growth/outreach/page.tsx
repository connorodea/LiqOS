"use client"

import * as React from "react"
import { IconRefresh, IconSend, IconUpload } from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

export default function GrowthOutreachPage() {
  const [campaign, setCampaign] = React.useState("")
  const [variant, setVariant] = React.useState("A")
  const [file, setFile] = React.useState<File | null>(null)
  const [sending, setSending] = React.useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
    } else {
      toast.error("Please select a CSV file")
    }
  }

  const handleSend = async () => {
    if (!campaign || !file) return
    setSending(true)
    try {
      // In production, you'd upload the file first and get a ref
      const fileRef = `uploads/${Date.now()}-${file.name}`
      
      const result = await apiClient<{ sent: number; failed: number; trace_id: string }>(
        "/growth/outreach/send",
        {
          method: "POST",
          body: { campaign, variant, file_ref: fileRef },
        }
      )
      toast.success(`Sent ${result.sent}, Failed ${result.failed}`, {
        description: `Trace: ${result.trace_id}`,
      })
      setCampaign("")
      setFile(null)
    } catch (error) {
      toast.error("Failed to send campaign", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSend className="size-5" />
            Send Campaign
          </CardTitle>
          <CardDescription>
            Programmatic outreach with A/B variants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaign">Campaign</Label>
              <Input
                id="campaign"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="private-dealflow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant">Variant</Label>
              <Select value={variant} onValueChange={setVariant}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Leads CSV</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>
            <Button
              onClick={handleSend}
              disabled={sending || !campaign || !file}
              className="w-full"
            >
              {sending && <IconRefresh className="mr-2 size-4 animate-spin" />}
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
