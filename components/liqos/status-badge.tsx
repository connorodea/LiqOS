import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  // Receiving
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",

  // Inventory
  RECEIVED: "bg-gray-100 text-gray-800 border-gray-200",
  TESTING: "bg-purple-100 text-purple-800 border-purple-200",
  GRADED: "bg-blue-100 text-blue-800 border-blue-200",
  IN_LOT: "bg-indigo-100 text-indigo-800 border-indigo-200",
  LISTED: "bg-cyan-100 text-cyan-800 border-cyan-200",
  SOLD: "bg-green-100 text-green-800 border-green-200",
  SHIPPED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REFURBISHING: "bg-orange-100 text-orange-800 border-orange-200",
  RECYCLED: "bg-stone-100 text-stone-800 border-stone-200",
  DISPOSED: "bg-red-100 text-red-800 border-red-200",

  // Lots
  BUILDING: "bg-amber-100 text-amber-800 border-amber-200",
  READY: "bg-blue-100 text-blue-800 border-blue-200",
  MANIFESTED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  LISTED_FOR_SALE: "bg-cyan-100 text-cyan-800 border-cyan-200",

  // Listings
  DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  ENDED: "bg-stone-100 text-stone-800 border-stone-200",

  // Shipments
  PREPARING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  LABEL_CREATED: "bg-blue-100 text-blue-800 border-blue-200",
  PICKED_UP: "bg-indigo-100 text-indigo-800 border-indigo-200",
  IN_TRANSIT: "bg-purple-100 text-purple-800 border-purple-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  EXCEPTION: "bg-red-100 text-red-800 border-red-200",

  // Refurbishment
  QUEUED: "bg-gray-100 text-gray-800 border-gray-200",
  QA_CHECK: "bg-amber-100 text-amber-800 border-amber-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",

  // Grades
  UNTESTED: "bg-gray-100 text-gray-700 border-gray-200",
  LN: "bg-emerald-100 text-emerald-800 border-emerald-200",
  VG: "bg-green-100 text-green-800 border-green-200",
  G: "bg-blue-100 text-blue-800 border-blue-200",
  PO: "bg-orange-100 text-orange-800 border-orange-200",
  SA: "bg-red-100 text-red-800 border-red-200",
  PARTS_ONLY: "bg-stone-100 text-stone-800 border-stone-200",
};

const GRADE_LABELS: Record<string, string> = {
  LN: "Like New",
  VG: "Very Good",
  G: "Good",
  PO: "Poor",
  SA: "Salvage",
  PARTS_ONLY: "Parts Only",
  UNTESTED: "Untested",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClasses = STATUS_COLORS[status] || "bg-gray-100 text-gray-800 border-gray-200";
  const label = status.replace(/_/g, " ");

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-semibold uppercase tracking-wider border",
        colorClasses,
        className
      )}
    >
      {label}
    </Badge>
  );
}

export function GradeBadge({ grade, className }: { grade: string; className?: string }) {
  const colorClasses = STATUS_COLORS[grade] || "bg-gray-100 text-gray-800 border-gray-200";
  const label = GRADE_LABELS[grade] || grade;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-semibold uppercase tracking-wider border",
        colorClasses,
        className
      )}
    >
      {label}
    </Badge>
  );
}
