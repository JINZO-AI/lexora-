import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// POST /api/contracts/[id]/reminder - set a reminder
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const { reminderType, remindAt, daysBefore, channel } = body;

  if (!reminderType || !remindAt) {
    return NextResponse.json({ error: "reminderType and remindAt are required" }, { status: 400 });
  }

  const contract = await db.contract.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const reminder = await db.contractReminder.create({
    data: {
      contractId: id,
      userId: user.id,
      reminderType,
      remindAt: new Date(remindAt),
      daysBefore: daysBefore || 7,
      channel: channel || "in_app",
    },
  });

  return NextResponse.json(reminder, { status: 201 });
}

// GET /api/contracts/[id]/reminder - list reminders for contract
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const reminders = await db.contractReminder.findMany({
    where: { contractId: id, userId: user.id },
    orderBy: { remindAt: "asc" },
  });

  return NextResponse.json({ reminders });
}
