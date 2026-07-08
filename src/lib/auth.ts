import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          throw new Error("No account found with this email");
        }

        if (user.isSuspended) {
          throw new Error("Your account has been suspended. Contact support.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          role: user.role,
          subscriptionPlan: user.subscriptionPlan,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.subscriptionPlan = (user as { subscriptionPlan: string }).subscriptionPlan;
      }
      // Refresh user data from DB to keep role/plan current
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id },
          select: { role: true, subscriptionPlan: true, isSuspended: true, name: true },
        });
        if (dbUser) {
          if (dbUser.isSuspended) throw new Error("Account suspended");
          token.role = dbUser.role;
          token.subscriptionPlan = dbUser.subscriptionPlan;
          token.name = dbUser.name || token.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.subscriptionPlan = token.subscriptionPlan as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      subscriptionPlan: string;
    };
  }
  interface User {
    role: string;
    subscriptionPlan: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    subscriptionPlan: string;
  }
}
