// API client for Upscaled Control Plane
// This file provides type-safe API calls to the backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  params?: Record<string, string | number | undefined>
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, params } = options

  // Build URL with query params
  const url = new URL(`${API_BASE}${path}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value))
      }
    })
  }

  // Get environment from localStorage or default to dev
  const env =
    typeof window !== "undefined"
      ? localStorage.getItem("upscaled-env") || "dev"
      : "dev"

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Upscaled-Env": env,
    "X-Upscaled-Trace-Id": crypto.randomUUID(),
  }

  // Add auth token if available
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("upscaled-token")
      : null
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `API Error: ${response.status}`)
  }

  return response.json()
}

// Type definitions for API responses
export interface Provider {
  provider: string
  status: string
  expires_at: string | null
  scopes: string[]
  last_checked_at: string
}

export interface Server {
  provider: string
  server_id: string
  name: string
  type: string
  region: string
  ipv4: string | null
  status: string
  created_at: string
}

export interface Order {
  order_id: string
  channel: string
  external_order_id: string
  status: string
  total: number
  currency: string
  customer: { name?: string; email?: string } | null
  created_at: string
  updated_at: string
}

export interface Listing {
  listing_id: string
  channel: string
  sku: string
  external_listing_id: string | null
  title: string
  price: number
  quantity: number
  status: string
  updated_at: string
}

export interface Shipment {
  shipment_id: string
  order_id: string
  carrier: string | null
  service: string | null
  tracking_number: string | null
  label_url: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface FinancialTransaction {
  txn_id: string
  source: string
  type: string
  amount: number
  currency: string
  reference: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface Event {
  event_id: string
  trace_id: string
  event_type: string
  entity_type: string
  entity_id: string
  payload: Record<string, unknown>
  created_at: string
}

export interface HealthCheck {
  name: string
  status: string
  latency_ms: number | null
  details: Record<string, unknown> | null
}

export interface PaginatedResponse<T> {
  items: T[]
  next_cursor: string | null
}
