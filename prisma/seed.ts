import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding LEXORA database...");

  // Create admin user
  // NOTE: In production, change this password immediately after first login
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "ChangeMeNow!2024", 10);
  const adminEmail = process.env.ADMIN_EMAIL || "admin@lexora.com";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminPassword },
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash: adminPassword,
      role: "admin",
      subscriptionPlan: "business",
      monthlyLimit: -1,
      companyName: "Lexora Inc.",
      companySize: "small",
    },
  });

  // Create demo user (only in development)
  let demoUserId: string | null = null;
  if (process.env.NODE_ENV !== "production") {
    const userPassword = await bcrypt.hash("demo123", 10);
    const demoUser = await prisma.user.upsert({
      where: { email: "demo@lexora.com" },
      update: { passwordHash: userPassword },
      create: {
        email: "demo@lexora.com",
        name: "Jordan Lee",
        passwordHash: userPassword,
        role: "user",
        subscriptionPlan: "pro",
        monthlyLimit: 50,
        companyName: "Acme Startup LLC",
        companySize: "small",
      },
    });
    demoUserId = demoUser.id;
  }

  // Create sample templates
  const templates = [
    {
      title: "Standard NDA Template",
      description: "A balanced mutual non-disclosure agreement suitable for small businesses.",
      category: "nda",
      content: `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into on {{effective_date}} by and between {{party_a_name}} and {{party_b_name}}.

1. PURPOSE
The parties wish to explore a potential business relationship and may disclose confidential information to each other.

2. CONFIDENTIAL INFORMATION
"Confidential Information" means any non-public information disclosed by one party to the other, including trade secrets, business plans, customer data, and technical information.

3. OBLIGATIONS
Each party agrees to:
(a) Keep all Confidential Information strictly confidential
(b) Use it solely for the purpose stated above
(c) Not disclose it to third parties without written consent
(d) Protect it with the same degree of care used for its own confidential information

4. TERM
This Agreement shall remain in effect for {{term_years}} years from the effective date.

5. RETURN OF INFORMATION
Upon request, each party shall return or destroy all Confidential Information within 30 days.

6. GOVERNING LAW
This Agreement is governed by the laws of {{jurisdiction}}.

SIGNATURES:
{{party_a_name}}: ____________________ Date: ________
{{party_b_name}}: ____________________ Date: ________`,
      isPublic: true,
      isApproved: true,
      createdBy: admin.id,
    },
    {
      title: "Simple Service Agreement",
      description: "A fair service provider agreement with balanced payment terms.",
      category: "service",
      content: `SERVICE AGREEMENT

This Service Agreement is made on {{effective_date}} between {{client_name}} ("Client") and {{provider_name}} ("Provider").

1. SERVICES
Provider agrees to perform the following services: {{service_description}}

2. PAYMENT
Client agrees to pay Provider {{payment_amount}} per {{payment_frequency}}. Payment is due within 30 days of invoice.

3. TERM
This agreement begins on {{start_date}} and continues for {{term_months}} months. Either party may terminate with 30 days written notice.

4. INTELLECTUAL PROPERTY
All work product created specifically for Client shall belong to Client upon full payment. Provider retains rights to pre-existing tools and methods.

5. CONFIDENTIALITY
Both parties agree to keep confidential information private for 2 years after termination.

6. LIMITATION OF LIABILITY
Each party's liability shall be limited to the fees paid in the prior 3 months.

7. GOVERNING LAW
{{jurisdiction}}

SIGNATURES:
Client: ____________________ Date: ________
Provider: ____________________ Date: ________`,
      isPublic: true,
      isApproved: true,
      createdBy: admin.id,
    },
  ];

  for (const tpl of templates) {
    const extractedVars = Array.from(tpl.content.matchAll(/\{\{(\w+)\}\}/g)).map((m) => m[1]);
    await prisma.contractTemplate.create({
      data: {
        ...tpl,
        variables: JSON.stringify([...new Set(extractedVars)]),
        language: "en",
      },
    });
  }

  // Create notifications for demo user (only if demo user exists)
  if (demoUserId) {
    await prisma.notification.createMany({
      data: [
        {
          userId: demoUserId,
          type: "welcome",
          title: "Welcome to LEXORA!",
          body: "Upload your first contract to get started with AI-powered risk analysis.",
        },
        {
          userId: demoUserId,
          type: "tip",
          title: "Pro tip: Use tags to organize contracts",
          body: "Tags help you quickly filter and find contracts by client, project, or type.",
        },
      ],
    });
  }

  console.log("✅ Seed complete!");
  console.log("");
  console.log("Admin account:");
  console.log(`  Email:    ${process.env.ADMIN_EMAIL || "admin@lexora.com"}`);
  console.log(`  Password: ${process.env.ADMIN_PASSWORD ? "(from ADMIN_PASSWORD env)" : "ChangeMeNow!2024"}`);
  console.log("");
  console.log("⚠️  IMPORTANT: Change the admin password immediately after first login!");
  console.log("");
  if (process.env.NODE_ENV !== "production") {
    console.log("Demo account (dev only):");
    console.log("  Email:    demo@lexora.com");
    console.log("  Password: demo123");
  }
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
