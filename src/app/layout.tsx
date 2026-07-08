import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: "LEXORA — AI Contract Intelligence Platform",
  description:
    "LEXORA helps SMEs identify risky clauses, understand legal language in plain English, and generate AI-powered counter-proposals in seconds.",
  keywords: [
    "contract analysis",
    "AI legal",
    "risk assessment",
    "contract intelligence",
    "legal tech",
    "counter-proposal",
    "SME legal tools",
  ],
  authors: [{ name: "LEXORA" }],
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "LEXORA — AI Contract Intelligence",
    description: "Analyze contracts in seconds. Identify risks. Generate counter-proposals.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "LEXORA — AI Contract Intelligence",
    description: "Analyze contracts in seconds. Identify risks. Generate counter-proposals.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&f[]=clash-display@500,600,700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
        <SonnerToaster position="top-right" />
      </body>
    </html>
  );
}
