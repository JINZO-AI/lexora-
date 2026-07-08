import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// PATCH /api/notifications/[id]/read
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const notification = await db.notification.findFirst({
    where: { id, userId: user.id },
  });

  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  const updated = await db.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });

  return NextResponse.json(updated);
}
