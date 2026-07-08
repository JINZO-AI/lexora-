import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiting (use @upstash/ratelimit + Redis in production)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const GENERAL_LIMIT = 60; // 60 requests per minute
const AI_LIMIT = 10; // 10 AI requests per minute
const AUTH_LIMIT = 10; // 10 auth attempts per minute

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIP || "unknown";
}

function rateLimit(ip: string, limit: number): boolean {
  const now = Date.now();
  const key = ip;
  const current = rateLimitMap.get(key);

  if (!current || now - current.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { count: 1, lastReset: now });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count++;
  return true;
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const ip = getClientIP(req);

  // Security headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // Rate limiting
  let limit = GENERAL_LIMIT;

  if (path.startsWith("/api/contracts/") && path.includes("/analyze")) {
    limit = AI_LIMIT;
  } else if (path.startsWith("/api/contracts/") && path.includes("/counter-proposal")) {
    limit = AI_LIMIT;
  } else if (path.startsWith("/api/templates/generate")) {
    limit = AI_LIMIT;
  } else if (path.startsWith("/api/auth/")) {
    limit = AUTH_LIMIT;
  }

  if (!rateLimit(ip, limit)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // Add rate limit headers
  response.headers.set("X-RateLimit-Limit", String(limit));

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
