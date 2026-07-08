# LEXORA — Deployment Guide

This guide covers deploying LEXORA to production. LEXORA is a Next.js 16 application that requires a database, AI provider, and (optionally) Stripe for payments.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (recommended) or SQLite (dev only)
- A Groq API key
- (Optional) Stripe account
- (Optional) A custom domain

---

## Option 1: Vercel (Recommended — Easiest)

Vercel is the easiest way to deploy LEXORA. The free tier is sufficient for getting started.

### Step 1: Prepare Your Repository

```bash
# Initialize git if you haven't
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/yourusername/lexora.git
git push -u origin main
```

### Step 2: Create a PostgreSQL Database

Use one of these free providers:
- [Supabase](https://supabase.com) — Free 500MB PostgreSQL
- [Neon](https://neon.tech) — Free 3GB PostgreSQL
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) — Integrated with Vercel

Copy your connection string (format: `postgresql://user:pass@host:5432/dbname`)

### Step 3: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Add Environment Variables (see below)
4. Click "Deploy"

### Step 4: Set Up Environment Variables

In Vercel Project Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `GROQ_API_KEY` | Your Groq API key |
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook setup |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |
| `STRIPE_PRICE_PRO_MONTHLY` | Stripe Price ID |
| `STRIPE_PRICE_PRO_YEARLY` | Stripe Price ID |
| `STRIPE_PRICE_BUSINESS_MONTHLY` | Stripe Price ID |
| `STRIPE_PRICE_BUSINESS_YEARLY` | Stripe Price ID |

### Step 5: Set Up Database

After first deploy, run Prisma migration:

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Run migration on production database
vercel env pull .env.local
npx prisma db push
npx prisma generate
```

### Step 6: Set Up Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret → Add as `STRIPE_WEBHOOK_SECRET` in Vercel

### Step 7: Add Custom Domain

1. In Vercel Project Settings → Domains
2. Add your domain (e.g., `lexora.com`)
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` to your custom domain

---

## Option 2: Self-Hosted (VPS with Docker)

### Step 1: Prepare Your Server

- Ubuntu 22.04+ or Debian 12+
- 2GB RAM minimum
- Docker and Docker Compose installed

### Step 2: Create Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3000
CMD ["node", "server.js"]
```

### Step 3: Create docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: lexora
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: lexora
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Step 4: Deploy

```bash
# Clone repo
git clone https://github.com/yourusername/lexora.git
cd lexora

# Configure environment
cp .env.example .env
# Edit .env with production values

# Start
docker-compose up -d

# Run database migration
docker-compose exec app npx prisma db push
```

### Step 5: Set Up Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name lexora.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Use [Certbot](https://certbot.eff.org/) for free SSL:
```bash
sudo certbot --nginx -d lexora.com
```

---

## Post-Deployment Checklist

- [ ] Set `NEXTAUTH_SECRET` to a strong random value
- [ ] Change demo credentials (admin@lexora.com, demo@lexora.com)
- [ ] Configure Groq API key
- [ ] Set up Stripe products and price IDs
- [ ] Configure Stripe webhook
- [ ] Test signup → upload → analysis flow
- [ ] Test subscription upgrade flow
- [ ] Verify legal pages are accessible (/privacy, /terms, /cookies)
- [ ] Set up error monitoring (Sentry, Vercel Analytics)
- [ ] Configure database backups
- [ ] Set up custom domain + SSL

---

## Database Backup

### PostgreSQL (Automated with Cron)

```bash
# Add to crontab - runs daily at 3am
0 3 * * * pg_dump $DATABASE_URL | gzip > /backups/lexora_$(date +\%Y\%m\%d).sql.gz

# Keep only last 30 days
0 4 * * * find /backups -name "lexora_*.sql.gz" -mtime +30 -delete
```

### Vercel Postgres / Supabase

Both providers offer automated daily backups on their free tiers. Check their dashboards.

---

## Troubleshooting

### "NEXTAUTH_SECRET is not set"
Generate a secret: `openssl rand -base64 32` and add to environment variables.

### "Groq API error"
- Verify `GROQ_API_KEY` is set correctly
- Check you have credits at console.groq.com
- Verify the model name matches what's available

### "Stripe webhook signature verification failed"
- Ensure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe Dashboard
- The webhook endpoint must be `https://yourdomain.com/api/stripe/webhook`

### "Database connection failed"
- Verify `DATABASE_URL` format is correct
- For PostgreSQL: `postgresql://user:pass@host:5432/dbname`
- Ensure your database allows connections from your deployment IP

### File uploads not working on Vercel
Vercel has an ephemeral filesystem. For production, use S3-compatible storage:
1. Set `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
2. The app will automatically use cloud storage when configured
