# Deployment Guide: DigitalOcean + Neon

This guide explains how to deploy the Todo API to DigitalOcean App Platform with Neon (PostgreSQL database) for both **staging** and **production** environments.

---

## Prerequisites

- DigitalOcean account (free tier available: $200 credit for 60 days)
- Neon account (free tier available)
- Docker Hub account

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
neonctl list-branches --project-id YOUR_PROJECT_ID

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

## Step 2: Set Up DigitalOcean App Platform

### Install DigitalOcean CLI (doctl)

```bash
# Linux
wget https://github.com/digitalocean/doctl/releases/latest/download/doctl-<version>-linux-amd64.tar.gz
tar xf ./doctl-*-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# macOS
brew install doctl

# Authenticate
doctl auth init
```

---

## Step 3: Create DigitalOcean Apps

### Using DigitalOcean Dashboard

1. Go to [digitalocean.com](https://cloud.digitalocean.com)
2. Click "Apps" → "Create App"
3. Select "Docker Hub" as image source
4. Configure your staging app:
   - Image: `amiyokm/todo-backend:staging`
   - HTTP Port: 3000
   - Health Check Path: `/health`
5. Repeat for production app with image: `amiyokm/todo-backend:production`

---

## Step 4: Configure Environment Variables

### Staging Environment

In DigitalOcean dashboard, go to your staging app → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon staging branch connection string |
| `JWT_SECRET` | Generate a random secret |
| `NODE_ENV` | `staging` |
| `PORT` | `3000` |

### Production Environment

In DigitalOcean dashboard, go to your production app → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon production branch connection string |
| `JWT_SECRET` | Generate a random secret (different from staging) |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

---

## Step 5: Configure Deployments

### Automatic Deployments

DigitalOcean App Platform automatically deploys when new Docker images are pushed:

| Branch | Docker Tag | Environment |
|--------|-----------|-------------|
| `develop` | `:staging` | Staging |
| `master` | `:production` | Production |

### Manual Deployment

Trigger a deployment from the dashboard:
1. Go to your app
2. Click "Deployments"
3. Click "Deploy" → "From Docker Hub image"

---

## Step 6: Run Migrations

Migrations are run automatically via GitHub Actions during deployment.

For manual migrations, use the Neon setup script:

```bash
cd backend
bun run neon:setup --environment=staging
# or
bun run neon:setup --environment=production
```

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                         GitHub                             │
│         ┌─────────────────┴─────────────────┐             │
│         │                                   │             │
│    develop branch                      master branch       │
│         │                                   │             │
│         ▼                                   ▼             │
│ ┌───────────────┐                   ┌───────────────┐    │
│ │   Staging     │                   │  Production   │    │
│ │  (DigitalOcean)│                  │  (DigitalOcean)│   │
│ │               │                   │               │    │
│ │ ┌───────────┐ │                   │ ┌───────────┐ │    │
│ │ │   Neon    │ │                   │ │   Neon    │ │    │
│ │ │  staging  │ │                   │ │ production│ │    │
│ │ │  branch   │ │                   │ │  branch   │ │    │
│ │ └───────────┘ │                   │ └───────────┘ │    │
│ └───────────────┘                   └───────────────┘    │
│         │                                   │             │
│         ▼                                   ▼             │
│  staging-app.onrender.com           production-app.onrender.com │
└────────────────────────────────────────────────────────────┘
```

---

## Pricing (2026)

### DigitalOcean App Platform
- Free tier: Basic apps with 256MB RAM
- Paid: $5-12/month depending on size
- Includes free SSL certificates

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

Ensure the `DATABASE_URL` matches the correct Neon branch.

### Health Check Failures

The app exposes `/health` endpoint for DigitalOcean health checks.

---

## Useful Commands

```bash
# List apps
doctl apps list

# View app logs
doctl apps logs <app-id>

# Get app details
doctl apps get <app-id>
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
2. Docker image built and pushed to Docker Hub
3. DigitalOcean App Platform auto-deploys from Docker Hub

### Monitoring Deployments

- GitHub Actions: Check "Actions" tab in repository
- DigitalOcean: Check dashboard for deployment logs
- Neon: Check branch status in console
