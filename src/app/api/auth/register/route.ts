import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, companyName, companySize } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || null,
        passwordHash,
        companyName: companyName?.trim() || null,
        companySize: companySize || null,
        role: "user",
        subscriptionPlan: "free",
        monthlyLimit: SUBSCRIPTION_PLANS.free.monthlyLimit,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionPlan: true,
        companyName: true,
        companySize: true,
        createdAt: true,
      },
    });

    // Create a welcome notification
    await db.notification.create({
      data: {
        userId: user.id,
        type: "welcome",
        title: "Welcome to LEXORA!",
        body: "Upload your first contract to get started with AI-powered risk analysis.",
        actionUrl: "contracts",
      },
    });

    return NextResponse.json({ user, message: "Account created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
