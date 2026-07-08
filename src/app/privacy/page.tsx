import { Metadata } from "next";
import { Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — LEXORA",
  description: "How LEXORA collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Scale className="h-5 w-5 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <span className="text-[17px] font-bold tracking-tight">LEXORA</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="prose prose-invert max-w-none space-y-6 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
            <p>LEXORA ("we", "us", "our") operates an AI-powered contract intelligence platform that helps businesses analyze legal documents. We respect your privacy and are committed to protecting your personal data.</p>
            <p className="mt-2">This Privacy Policy explains how we collect, use, and disclose your information when you use our website and services (the "Service").</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
            <p><strong className="text-foreground">Account Information:</strong> Name, email address, company name, and password (hashed) when you create an account.</p>
            <p className="mt-2"><strong className="text-foreground">Contract Documents:</strong> The contracts and legal documents you upload for analysis. These are stored securely and are only accessible from your account.</p>
            <p className="mt-2"><strong className="text-foreground">Usage Data:</strong> Information about how you interact with the Service, including IP address, browser type, pages visited, and timestamps.</p>
            <p className="mt-2"><strong className="text-foreground">Payment Information:</strong> When you upgrade to a paid plan, payment is processed by Stripe. We do not store your credit card details — only your subscription status.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and maintain the Service</li>
              <li>To analyze your uploaded contracts using AI (powered by Groq or similar LLM providers)</li>
              <li>To manage your account and subscription</li>
              <li>To send you notifications about your contracts and account</li>
              <li>To provide customer support</li>
              <li>To detect, prevent, and address technical issues and fraud</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. AI Processing Disclosure</h2>
            <p>When you upload a contract for analysis, the text content is sent to our AI provider (Groq) for processing. The AI provider may temporarily process this data to generate your analysis but does not store it permanently or use it to train their models.</p>
            <p className="mt-2">We recommend reviewing your AI provider's data retention policy. Do not upload contracts containing information you are not authorized to share with third-party processors.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Storage and Security</h2>
            <p>Your data is stored on secure servers. We use industry-standard security measures including:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Encrypted password hashing (bcrypt)</li>
              <li>HTTPS/TLS encryption for data in transit</li>
              <li>Secure session management with JWT tokens</li>
              <li>Rate limiting to prevent abuse</li>
              <li>Regular security audits</li>
            </ul>
            <p className="mt-2">However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Retention</h2>
            <p>We retain your data for as long as your account is active. When you delete your account, we remove your personal data and uploaded contracts within 30 days, except where we are required to retain data for legal compliance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Data Sharing</h2>
            <p>We do not sell your data. We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong className="text-foreground">AI Providers:</strong> To process contract analysis (text content only)</li>
              <li><strong className="text-foreground">Payment Processors:</strong> Stripe for subscription billing</li>
              <li><strong className="text-foreground">Cloud Infrastructure:</strong> Hosting providers for data storage</li>
              <li><strong className="text-foreground">Legal Authorities:</strong> If required by law or court order</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Your Rights (GDPR/CCPA)</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data ("right to be forgotten")</li>
              <li>Export your data in a portable format</li>
              <li>Object to processing</li>
              <li>Withdraw consent</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at privacy@lexora.com</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Cookies</h2>
            <p>We use essential cookies for authentication and session management. See our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a> for details.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Children's Privacy</h2>
            <p>The Service is not intended for users under 18. We do not knowingly collect data from children.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">12. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, contact us at:</p>
            <p className="mt-2">Email: privacy@lexora.com</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <a href="/" className="text-sm text-primary hover:underline">← Back to LEXORA</a>
        </div>
      </div>
    </div>
  );
}
