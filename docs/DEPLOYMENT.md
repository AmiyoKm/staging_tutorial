# Deployment Guide: Railway + Neon

This guide explains how to deploy the Todo API to Railway (app hosting) with Neon (PostgreSQL database) for both **staging** and **production** environments.

---

## Prerequisites

- Railway account (free tier available)
- Neon account (free tier available)
- GitHub repository connected to Railway

---

## Step 1: Set Up Neon Database

### Create Neon Project

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Note your connection string (format: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)

### Create Branches for Staging/Production

Neon supports database branching - each branch is a separate isolated database.

```bash
# Install Neon CLI
npm install -g neonctl

# Authenticate
neonctl auth

# List branches (you start with one called 'br-diffusion')
neonctl list-brands --project-id YOUR_PROJECT_ID

# Create staging branch
neonctl branches create --project-id YOUR_PROJECT_ID --name staging --parent-id br-diffusion

# Create production branch
neonctl branches create --project-id YOUR_PROJECT_ID --name production --parent-id br-diffusion
```

### Get Connection Strings

Each branch has its own connection URL:

```bash
# Get connection string for staging
neonctl connection-string --project-id YOUR_PROJECT_ID --branch-name staging

# Get connection string for production
neonctl connection-string --project-id YOUR_PROJECT_ID --branch-name production
```

---

## Step 2: Set Up Railway

### Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### Initialize Railway Project

```bash
cd backend
railway init
```

### Link to GitHub Repository

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository

---

## Step 3: Create Railway Services

### Option A: Using Railway CLI

```bash
# Create staging service
railway add --service=staging

# Create production service
railway add --service=production
```

### Option B: Using Railway Dashboard

1. Create a new project
2. Click "New Service" → "GitHub Repo"
3. Select your repository

---

## Step 4: Configure Environment Variables

### Staging Environment

In Railway dashboard, go to your staging service → Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon staging branch connection string |
| `JWT_SECRET` | Generate a random secret |
| `NODE_ENV` | `staging` |
| `PORT` | `3000` |

### Production Environment

In Railway dashboard, go to your production service → Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon production branch connection string |
| `JWT_SECRET` | Generate a random secret (different from staging) |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

---

## Step 5: Configure Deployments

### Automatic Deployments

Railway automatically deploys when you push to connected branches:

| Branch | Environment |
|--------|-------------|
| `develop` | Staging |
| `main` | Production |

### Manual Deployment

```bash
# Deploy to staging
railway up --service=staging

# Deploy to production
railway up --service=production
```

---

## Step 6: Run Migrations

### Option A: Railway CLI (Recommended)

```bash
# Set environment context
railway variables --service=staging

# Run migrations
railway run "bun run db:migrate"
```

### Option B: One-off Command in Dashboard

1. Go to your service in Railway dashboard
2. Click "New" → "One-off Command"
3. Enter: `bun run db:migrate`

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                         GitHub                             │
│         ┌─────────────────┴─────────────────┐             │
│         │                                   │             │
│    develop branch                      main branch        │
│         │                                   │             │
│         ▼                                   ▼             │
│ ┌───────────────┐                   ┌───────────────┐    │
│ │   Staging     │                   │  Production   │    │
│ │  (Railway)    │                   │  (Railway)    │    │
│ │               │                   │               │    │
│ │ ┌───────────┐ │                   │ ┌───────────┐ │    │
│ │ │   Neon    │ │                   │ │   Neon    │ │    │
│ │ │  staging  │ │                   │ │ production│ │    │
│ │ │  branch   │ │                   │ │  branch   │ │    │
│ │ └───────────┘ │                   │ └───────────┘ │    │
│ └───────────────┘                   └───────────────┘    │
│         │                                   │             │
│         ▼                                   ▼             │
│  staging.railway.app               production.railway.app │
└────────────────────────────────────────────────────────────┘
```

---

## Free Tier Limits (2026)

### Railway
- ~$5/month free credit
- After credit: $5-7/month per service

### Neon
- 0.5 GB storage per project
- 50K active rows/month
- Serverless (scales to zero when idle)

---

## Troubleshooting

### Database Connection Issues

Make sure your `DATABASE_URL` includes `?sslmode=require`:

```
postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### Migration Failures

Ensure the `DATABASE_URL` in Railway matches the branch you want to migrate.

### Health Check Failures

The app exposes `/health` endpoint for Railway health checks.

---

## Useful Commands

```bash
# View logs
railway logs --service=staging

# Open in browser
railway open --service=staging

# View environment variables
railway variables --service=staging

# Shell into container
railway shell --service=staging
```

---

## GitHub Actions Deployment (Automated)

This project uses automated deployment via GitHub Actions.

### Prerequisites

Configure these secrets in GitHub repository settings:

| Secret | Value | How to Get |
|--------|-------|------------|
| `NEON_PROJECT_ID` | `sparkling-voice-51393485` | From Neon console |
| `NEON_API_KEY` | Your API key | Neon → Account → API Keys |
| `DOCKER_USERNAME` | `amiyokm` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Access token | Docker Hub → Account Settings → Security |

### Deployment Flow

1. **Push to `develop`** → Triggers staging deployment
2. **Push to `master`** → Triggers production deployment

### What Happens During Deployment

1. Neon setup script runs:
   - Checks if branch exists
   - Creates branch if needed
   - Gets connection string
   - Runs migrations
2. Docker image built and pushed
3. Railway auto-deploys from Docker Hub

### Manual Deployment

To manually trigger deployment, use the Railway CLI:

```bash
# Staging
railway up --service=staging

# Production
railway up --service=production
```

### Monitoring Deployments

- GitHub Actions: Check "Actions" tab in repository
- Railway: Check dashboard for deployment logs
- Neon: Check branch status in console
