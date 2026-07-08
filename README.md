# LEXORA — AI Contract Intelligence Platform

LEXORA is an AI-powered contract intelligence platform that helps SMEs identify risky clauses, understand legal language in plain English, and generate counter-proposals in seconds.

## Features

- **AI Contract Analysis** — Upload PDF/DOCX/TXT contracts and get instant risk scoring (0-100) with clause-level breakdown
- **Clause Extraction** — Identifies 11+ clause types (liability, payment, termination, IP, auto-renewal, etc.)
- **Plain-English Explanations** — Every clause explained in simple terms
- **AI Counter-Proposals** — Ready-to-send replacement text for risky clauses
- **Contract Templates** — Pre-built legal templates with AI generation
- **Contract Sharing** — Generate public read-only links to share analyses
- **HTML Report Export** — Download formatted analysis reports
- **Dashboard & Analytics** — KPIs, charts, risk distribution, usage tracking
- **Admin Panel** — User management, platform analytics, settings
- **Subscription Billing** — Stripe-powered subscription system (Free/Pro/Business plans)
- **Multi-language Support** — EN, FR, ES, AR

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | Prisma ORM (SQLite dev / PostgreSQL prod) |
| Authentication | NextAuth.js v4 (Credentials provider) |
| AI Provider | Groq SDK (LLaMA 3.3 70B) |
| Payments | Stripe (Checkout + Webhooks) |
| UI | shadcn/ui + Tailwind CSS 4 |
| Charts | Recharts |
| State | Zustand |
| File Parsing | pdf-parse |

## Quick Start

### Prerequisites

- Node.js 20+
- npm or bun
- A Groq API key (free at [console.groq.com](https://console.groq.com))
- (Optional) Stripe account for payments
- (Optional) PostgreSQL for production

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/lexora.git
cd lexora

# Install dependencies
npm install
# or
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your values (see Configuration section below)

# Set up the database
npx prisma db push
npx prisma generate

# Seed demo data (optional)
npx tsx prisma/seed.ts

# Start the development server
npm run dev
# or
bun run dev
```

Visit `http://localhost:3000` to see the app.

### Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lexora.com | admin123 |
| User | demo@lexora.com | user123 |

**⚠️ IMPORTANT: Change these credentials before deploying to production.**

## Configuration

Create a `.env` file based on `.env.example`:

### Required

```env
# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL="file:./db/custom.db"
# For production: DATABASE_URL="postgresql://user:pass@localhost:5432/lexora"

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# AI Provider — Groq (get key at https://console.groq.com)
GROQ_API_KEY="gsk_your_key_here"
```

### Optional (for production)

```env
# Stripe (get keys at https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Stripe Price IDs (create products in Stripe Dashboard)
STRIPE_PRICE_PRO_MONTHLY="price_..."
STRIPE_PRICE_PRO_YEARLY="price_..."
STRIPE_PRICE_BUSINESS_MONTHLY="price_..."
STRIPE_PRICE_BUSINESS_YEARLY="price_..."

# Email (Resend — get key at https://resend.com)
RESEND_API_KEY="re_..."
FROM_EMAIL="hello@yourdomain.com"

# Cloud Storage (optional — falls back to local /storage)
S3_BUCKET="your-bucket"
S3_REGION="us-east-1"
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."
```

## Deployment

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables in Vercel project settings
4. Change `DATABASE_URL` to a PostgreSQL connection string
   - Use [Supabase](https://supabase.com), [Neon](https://neon.tech), or [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
5. Run `npx prisma db push` with the production database URL
6. Deploy

### Option 2: Self-Hosted (Docker)

```bash
# Build and run with Docker (Dockerfile coming soon)
docker build -t lexora .
docker run -p 3000:3000 --env-file .env lexora
```

### Option 3: Traditional VPS

1. Install Node.js 20+ and PostgreSQL on your server
2. Clone the repo and install dependencies
3. Configure `.env` with production values
4. Run `npx prisma db push` to set up the database
5. Build with `npm run build`
6. Start with `npm run start` behind a reverse proxy (Nginx/Caddy)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

## Database Migration (SQLite → PostgreSQL)

For production, use PostgreSQL instead of SQLite:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:pass@localhost:5432/lexora"
   ```
3. Create and run migrations:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes (33 endpoints)
│   │   ├── auth/         # NextAuth (login, register, session)
│   │   ├── contracts/    # Contract CRUD + analysis + share
│   │   ├── templates/    # Template CRUD + AI generation
│   │   ├── stripe/       # Stripe checkout + webhooks
│   │   ├── dashboard/    # Dashboard stats
│   │   ├── admin/        # Admin panel APIs
│   │   ├── profile/      # User profile management
│   │   ├── notifications/# Notification management
│   │   └── tags/         # Tag management
│   ├── privacy/          # Privacy Policy page
│   ├── terms/            # Terms of Service page
│   ├── cookies/          # Cookie Policy page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main page (SPA router)
│   └── globals.css       # Global styles + design system
├── components/
│   ├── app/              # AppShell (sidebar, header)
│   ├── shared/           # RiskBadge, RiskGauge
│   ├── ui/               # shadcn/ui components
│   └── views/            # Page views (dashboard, contracts, etc.)
├── lib/
│   ├── ai-service.ts     # Groq AI integration
│   ├── auth.ts           # NextAuth config
│   ├── db.ts             # Prisma client
│   ├── file-storage.ts   # File upload/storage
│   ├── constants.ts      # Shared constants
│   ├── store.ts          # Zustand store
│   └── types.ts          # TypeScript types
└── middleware.ts          # Rate limiting + security headers
```

## Security

- **Authentication**: NextAuth.js with bcrypt password hashing + JWT sessions
- **Rate Limiting**: In-memory rate limiting on API routes (60 req/min general, 10 req/min AI)
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Input Validation**: All API inputs validated
- **CSRF Protection**: NextAuth built-in CSRF tokens
- **File Upload**: Size limits (10MB), type validation, SHA256 dedup

## License

This project is proprietary software. See [LICENSE](./LICENSE) for details.

## Support

- Email: support@lexora.com
- Documentation: See `/help` in the app
- Legal: See [Privacy Policy](./src/app/privacy/page.tsx), [Terms](./src/app/terms/page.tsx)
