import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// POST /api/profile/password - change password
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new passwords are required" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "password_changed",
      entityType: "user",
      entityId: user.id,
      ipAddress: req.headers.get("x-forwarded-for") || null,
      userAgent: req.headers.get("user-agent") || null,
    },
  });

  return NextResponse.json({ success: true });
}
