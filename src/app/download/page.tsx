import { Metadata } from "next";
import { Scale, Download, FileCode, Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Download Source Code — LEXORA",
};

export default function DownloadPage() {
  const files = [
    { path: "src/app/globals.css", desc: "Design system (colors, shadows, animations)" },
    { path: "src/app/layout.tsx", desc: "Root layout (fonts, metadata)" },
    { path: "src/app/page.tsx", desc: "SPA router (view switching)" },
    { path: "src/components/app/app-shell.tsx", desc: "Sidebar + header + notifications" },
    { path: "src/components/shared/risk-badge.tsx", desc: "Risk level pill component" },
    { path: "src/components/shared/risk-gauge.tsx", desc: "Animated SVG risk gauge" },
    { path: "src/components/ui/button.tsx", desc: "Button variants" },
    { path: "src/components/ui/card.tsx", desc: "Card components" },
    { path: "src/components/ui/input.tsx", desc: "Input field" },
    { path: "src/components/views/landing-view.tsx", desc: "Landing page (hero, features, auth)" },
    { path: "src/components/views/dashboard-view.tsx", desc: "User dashboard" },
    { path: "src/components/views/contract-list-view.tsx", desc: "Contracts list" },
    { path: "src/components/views/contract-upload-view.tsx", desc: "Upload form" },
    { path: "src/components/views/contract-analysis-view.tsx", desc: "Analysis page (1024 lines)" },
    { path: "src/components/views/templates-view.tsx", desc: "Templates list + builder" },
    { path: "src/components/views/settings-view.tsx", desc: "User settings" },
    { path: "src/components/views/billing-view.tsx", desc: "Billing/pricing" },
    { path: "src/components/views/shared-contract-view.tsx", desc: "Public shared view" },
    { path: "src/components/views/admin-views.tsx", desc: "Admin panel (analytics, users, contracts)" },
    { path: "src/components/views/admin-settings-view.tsx", desc: "Admin settings" },
    { path: "src/lib/store.ts", desc: "Zustand state management" },
    { path: "src/lib/types.ts", desc: "TypeScript interfaces" },
    { path: "src/lib/constants.ts", desc: "Constants (colors, types)" },
    { path: "src/lib/api-client.ts", desc: "API fetch wrapper" },
    { path: "README.md", desc: "Full documentation" },
    { path: "DEPLOYMENT.md", desc: "Deployment guide" },
    { path: ".env.example", desc: "Environment variables template" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Scale className="h-5 w-5 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <span className="text-[17px] font-bold tracking-tight">LEXORA</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Download Frontend Source Code</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Complete frontend codebase — 28 files, ready to hand to your frontend designer.
        </p>

        {/* Download button */}
        <a
          href="/lexora-frontend.zip"
          download
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[15px] font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md mb-12"
        >
          <Download className="h-5 w-5" />
          Download All Files (.zip — 87KB)
        </a>

        {/* File list */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-[18px] font-semibold">What's Inside ({files.length} files)</h2>
          </div>
          <div className="space-y-1">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary transition-colors">
                <FileCode className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <code className="text-[12.5px] font-mono text-foreground flex-shrink-0">{file.path}</code>
                <span className="text-[12px] text-muted-foreground truncate">— {file.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-[18px] font-semibold mb-3">How to Use This Code</h2>
          <ol className="space-y-2 text-[14px] text-muted-foreground">
            <li>1. Click the download button above to get the .zip file</li>
            <li>2. Unzip it on your computer</li>
            <li>3. Share all the files with your frontend AI/designer</li>
            <li>4. Tell them: "Redesign the visual style only — keep all functionality and API calls intact"</li>
            <li>5. The key files to redesign are: <code className="text-foreground">globals.css</code>, <code className="text-foreground">app-shell.tsx</code>, and all files in <code className="text-foreground">views/</code></li>
            <li>6. Don't change: <code className="text-foreground">store.ts</code>, <code className="text-foreground">types.ts</code>, <code className="text-foreground">api-client.ts</code> (these handle logic, not visuals)</li>
          </ol>
        </div>

        <div className="mt-8">
          <a href="/" className="text-sm text-primary hover:underline">← Back to LEXORA</a>
        </div>
      </div>
    </div>
  );
}
