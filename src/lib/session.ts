import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  subscriptionPlan: string;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function getCurrentUserWithProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          contracts: true,
          templates: true,
          notifications: { where: { isRead: false } },
        },
      },
    },
  });

  if (!user || user.isSuspended) return null;
  return user;
}

export function requireAuth(user: SessionUser | null) {
  if (!user) {
    throw new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

export function requireAdmin(user: SessionUser | null) {
  const u = requireAuth(user);
  if (u.role !== "admin") {
    throw new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return u;
}
