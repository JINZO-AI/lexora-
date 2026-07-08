import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/admin/audit-logs
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  return NextResponse.json({
    logs: logs.map((l) => ({
      ...l,
      oldValues: l.oldValues ? JSON.parse(l.oldValues) : null,
      newValues: l.newValues ? JSON.parse(l.newValues) : null,
    })),
  });
}
