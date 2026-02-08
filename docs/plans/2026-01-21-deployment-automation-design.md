# Deployment Automation Design

**Date:** 2026-01-21
**Author:** Design document for CI/CD deployment automation

## Overview

Automated deployment pipeline for Todo API using GitHub Actions, Docker Hub, Railway, and Neon PostgreSQL.

## Architecture

### Deployment Flow

```
Developer Push
     │
     ├─ develop branch → deploy-staging.yml
     └─ master branch → deploy-production.yml
           │
           ▼
    GitHub Actions
     ├── setup-neon.ts (ensure Neon branch exists)
     ├── Build Docker image
     ├── Push to Docker Hub (amiyokm/todo-backend:staging|production)
     ├── Run migrations on Neon branch
     └─ Smoke tests
           │
           ▼
    Railway (Auto-deploys from Docker Hub)
           │
           ▼
    Neon Database (staging|production branch)
```

### Key Design Decisions

1. **Docker Hub + Railway**: GitHub Actions builds/pushes images; Railway auto-deploys from Docker Hub tags
2. **GitHub Actions orchestrates everything**: Sets up Neon, publishes artifacts, runs migrations and tests
3. **No direct GitHub-to-Railway integration**: Railway watches Docker Hub, simplifying workflows
4. **Isolated databases**: Neon branches provide separate staging/production data

## Components

### 1. Backend Scripts

**Location:** `backend/scripts/`

```
scripts/
├── setup-neon.ts    # Main Neon setup script
└── neon-utils.ts    # Neon MCP helper utilities
```

**setup-neon.ts** - Called by GitHub Actions with environment flag:
- Validates environment argument (staging|production)
- Lists Neon branches via MCP
- Creates staging branch if missing (one-time)
- Gets connection string for target branch
- Runs migrations: `bun run db:migrate`
- Outputs success/failure

**Added to backend/package.json:**
```json
{
  "scripts": {
    "neon:setup": "bun run scripts/setup-neon.ts"
  }
}
```

### 2. Neon Database

**Project:** `staging_tutorial` (ID: `sparkling-voice-51393485`)

**Branches:**
- `production` - Primary branch (already exists)
- `staging` - Created from production parent (one-time setup)

**Connection Strings:**
- Retrieved via Neon MCP tools in setup script
- Added to Railway as environment variables (one-time manual)

### 3. GitHub Actions Workflows

**deploy-staging.yml** (triggered on push to `develop`):
1. Checkout, setup Bun, install dependencies
2. Run `bun run neon:setup --environment=staging`
3. Build and push Docker image `:staging`
4. Run smoke tests

**deploy-production.yml** (triggered on push to `master`):
1. Checkout, setup Bun, install dependencies
2. Run `bun run neon:setup --environment=production`
3. Create version tag
4. Build and push Docker images `:production` and `:latest`
5. Run health checks

**ci.yml** - No changes (existing tests remain)

### 4. Railway Configuration

**Services:**
- `todo-api-staging` - Watches `amiyokm/todo-backend:staging`
- `todo-api-production` - Watches `amiyokm/todo-backend:production`

**Environment Variables (per service):**
```
DATABASE_URL = <NEON_BRANCH_CONNECTION_STRING>
JWT_SECRET = <RANDOM_SECRET>
NODE_ENV = staging|production
PORT = 3000
```

**Auto-deploy:** Enabled from Docker Hub tags

**railway.toml:** Already configured, no changes needed

### 5. GitHub Secrets

| Secret | Value | Source |
|--------|-------|--------|
| `NEON_PROJECT_ID` | `sparkling-voice-51393485` | Known |
| `NEON_API_KEY` | Neon API key | neon.tech → Account |
| `DOCKER_USERNAME` | `amiyokm` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token | Docker Hub → Account Settings |

## Verification

### Staging Pipeline
1. Push to `develop` branch
2. CI runs tests
3. After merge to `develop`, deploy-staging.yml triggers
4. Neon staging branch verified
5. Migrations run on staging
6. Docker image pushed `:staging`
7. Railway auto-deploys
8. Smoke tests run
9. Health check: `https://staging-url.railway.app/health`

### Production Pipeline
1. Push to `master` branch
2. deploy-production.yml triggers
3. Neon production branch verified
4. Migrations run on production
5. Version tag created
6. Docker images pushed `:production`, `:latest`
7. Railway auto-deploys
8. Health check: `https://production-url.railway.app/health`

## Implementation Notes

- **Idempotent scripts**: Safe to run multiple times
- **Environment-agnostic**: Same script handles staging/production via flag
- **TypeScript + Bun**: Matches existing backend stack
- **MCP-based**: Uses Neon MCP server tools for API calls
- **Existing railway.toml**: No modifications needed
