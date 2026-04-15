import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/liqos/page-header";
import { StatCard } from "@/components/liqos/stat-card";
import { GradeBadge } from "@/components/liqos/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import type { RefurbishmentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const COLUMNS: {
  status: RefurbishmentStatus;
  label: string;
  color: string;
}[] = [
  { status: "QUEUED", label: "Queued", color: "bg-gray-100" },
  { status: "IN_PROGRESS", label: "In Progress", color: "bg-blue-50" },
  { status: "QA_CHECK", label: "QA Check", color: "bg-amber-50" },
  { status: "COMPLETED", label: "Completed", color: "bg-green-50" },
];

export default async function RefurbishmentPage() {
  const [jobs, totalQueued] = await Promise.all([
    prisma.refurbishmentJob.findMany({
      where: { status: { in: ["QUEUED", "IN_PROGRESS", "QA_CHECK", "COMPLETED"] } },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      include: {
        inventoryItem: {
          select: { name: true, sku: true, grade: true, brand: true },
        },
      },
      take: 200,
    }),
    prisma.refurbishmentJob.count({
      where: { status: { in: ["QUEUED", "IN_PROGRESS"] } },
    }),
  ]);

  const jobsByStatus = COLUMNS.map((col) => ({
    ...col,
    jobs: jobs.filter((j) => j.status === col.status),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refurbishment"
        description="Track repair and refurbishment jobs"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total in Queue"
          value={totalQueued.toLocaleString()}
          icon={Wrench}
        />
        <StatCard
          title="In Progress"
          value={jobsByStatus.find((c) => c.status === "IN_PROGRESS")?.jobs.length.toLocaleString() || "0"}
          icon={Clock}
        />
        <StatCard
          title="QA Check"
          value={jobsByStatus.find((c) => c.status === "QA_CHECK")?.jobs.length.toLocaleString() || "0"}
          icon={AlertTriangle}
        />
        <StatCard
          title="Completed"
          value={jobsByStatus.find((c) => c.status === "COMPLETED")?.jobs.length.toLocaleString() || "0"}
          icon={CheckCircle}
        />
      </div>

      {/* Kanban Board */}
      <div className="grid gap-4 lg:grid-cols-4">
        {jobsByStatus.map((column) => (
          <div key={column.status} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{column.label}</h3>
              <Badge variant="secondary" className="text-[10px]">
                {column.jobs.length}
              </Badge>
            </div>

            <div className={`rounded-lg p-2 space-y-2 min-h-[200px] ${column.color}`}>
              {column.jobs.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                  No jobs
                </div>
              ) : (
                column.jobs.map((job) => (
                  <Card key={job.id} className="py-2">
                    <CardContent className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {job.inventoryItem.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {job.inventoryItem.sku}
                          </p>
                        </div>
                        {job.gradeBefore && (
                          <GradeBadge grade={job.gradeBefore} />
                        )}
                      </div>

                      {job.jobType && (
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {job.jobType}
                        </Badge>
                      )}

                      <div className="flex items-center justify-between">
                        {job.assignedTo ? (
                          <span className="text-[10px] text-muted-foreground">
                            Assigned to: {job.assignedTo}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">
                            Unassigned
                          </span>
                        )}
                        {job.priority > 0 && (
                          <Badge variant="destructive" className="text-[9px]">
                            P{job.priority}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
