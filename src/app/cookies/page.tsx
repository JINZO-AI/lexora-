import { Metadata } from "next";
import { Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy — LEXORA",
  description: "How LEXORA uses cookies.",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Scale className="h-5 w-5 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <span className="text-[17px] font-bold tracking-tight">LEXORA</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="prose prose-invert max-w-none space-y-6 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help with authentication, remembering preferences, and analyzing traffic.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Cookies</h2>
            <p>LEXORA uses the following types of cookies:</p>

            <h3 className="text-[16px] font-semibold text-foreground mt-4 mb-2">Essential Cookies (Required)</h3>
            <p>These cookies are necessary for the Service to function:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong className="text-foreground">next-auth.session-token:</strong> Maintains your login session</li>
              <li><strong className="text-foreground">next-auth.csrf-token:</strong> Protects against cross-site request forgery</li>
              <li><strong className="text-foreground">next-auth.callback-url:</strong> Remembers where to redirect after login</li>
            </ul>

            <h3 className="text-[16px] font-semibold text-foreground mt-4 mb-2">Analytics Cookies (Optional)</h3>
            <p>If enabled, these cookies help us understand how the Service is used:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong className="text-foreground">_ga:</strong> Google Analytics (if enabled)</li>
              <li><strong className="text-foreground">_gid:</strong> Google Analytics user identification</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Managing Cookies</h2>
            <p>You can control and delete cookies through your browser settings. Note that disabling essential cookies will prevent you from logging in and using the Service.</p>
            <p className="mt-2">To manage cookies in your browser:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong className="text-foreground">Chrome:</strong> Settings → Privacy and security → Cookies</li>
              <li><strong className="text-foreground">Firefox:</strong> Settings → Privacy & Security → Cookies</li>
              <li><strong className="text-foreground">Safari:</strong> Preferences → Privacy → Cookies</li>
              <li><strong className="text-foreground">Edge:</strong> Settings → Cookies and site permissions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Third-Party Cookies</h2>
            <p>We may use third-party services that set their own cookies:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong className="text-foreground">Stripe:</strong> For secure payment processing</li>
              <li><strong className="text-foreground">Google Analytics:</strong> For traffic analysis (if enabled)</li>
            </ul>
            <p className="mt-2">These third parties have their own privacy policies governing cookie use.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Cookie Duration</h2>
            <p>Session cookies are deleted when you close your browser. Persistent cookies (like the "remember me" session) last up to 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Changes to This Policy</h2>
            <p>We may update this Cookie Policy from time to time. Changes take effect immediately upon posting.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Contact</h2>
            <p>For questions about cookies, contact us at: privacy@lexora.com</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <a href="/" className="text-sm text-primary hover:underline">← Back to LEXORA</a>
        </div>
      </div>
    </div>
  );
}
