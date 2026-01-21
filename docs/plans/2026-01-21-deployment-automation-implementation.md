# Deployment Automation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automate CI/CD pipeline with GitHub Actions, Docker Hub, Railway, and Neon PostgreSQL for staging and production deployments.

**Architecture:** GitHub Actions orchestrates the pipeline - builds Docker images, pushes to Docker Hub, sets up Neon branches via MCP, runs migrations. Railway auto-deploys from Docker Hub tags. Neon branches provide isolated staging/production databases.

**Tech Stack:** GitHub Actions, Docker, Railway, Neon PostgreSQL (via MCP), TypeScript/Bun, Drizzle ORM

---

## Prerequisites

Before starting, ensure you have:
- Neon account with project `staging_tutorial` (ID: `sparkling-voice-51393485`)
- Docker Hub account with username `amiyokm`
- Railway account
- GitHub repository access

---

## Task 1: Create Scripts Folder and Utilities

**Files:**
- Create: `backend/scripts/neon-utils.ts`

**Step 1: Create the scripts folder**

```bash
mkdir -p backend/scripts
```

**Step 2: Write Neon utility functions**

```typescript
// backend/scripts/neon-utils.ts

/**
 * Neon MCP helper utilities for deployment automation
 * These utilities wrap Neon MCP server tool calls
 */

export interface NeonConfig {
  projectId: string;
  apiKey: string;
}

export interface BranchInfo {
  id: string;
  name: string;
  state: string;
}

export const ENVIRONMENT_BRANCHES = {
  staging: 'staging',
  production: 'production'
} as const;

export type Environment = keyof typeof ENVIRONMENT_BRANCHES;

/**
 * Validates environment argument
 */
export function validateEnvironment(env: string): Environment {
  const validEnvs = Object.keys(ENVIRONMENT_BRANCHES);
  if (!validEnvs.includes(env)) {
    throw new Error(`Invalid environment: ${env}. Must be one of: ${validEnvs.join(', ')}`);
  }
  return env as Environment;
}

/**
 * Parses CLI arguments
 */
export function parseArgs(): { environment: Environment } {
  const args = process.argv.slice(2);
  const envArg = args.find(arg => arg.startsWith('--environment='));

  if (!envArg) {
    throw new Error('--environment flag is required (staging|production)');
  }

  const environment = envArg.split('=')[1];
  return { environment: validateEnvironment(environment) };
}
```

**Step 3: Commit**

```bash
git add backend/scripts/neon-utils.ts
git commit -m "feat(neon): add utility functions for Neon setup

Add argument parsing and environment validation for deployment scripts.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create Main Neon Setup Script

**Files:**
- Create: `backend/scripts/setup-neon.ts`
- Modify: `backend/package.json` (add script and dev dependency)

**Step 1: Write the main setup script**

```typescript
#!/usr/bin/env bun
// backend/scripts/setup-neon.ts

/**
 * Neon setup script for CI/CD deployment
 *
 * Usage: bun run neon:setup --environment=staging|production
 *
 * This script:
 * 1. Ensures the Neon branch exists for the environment
 * 2. Gets the connection string for that branch
 * 3. Runs migrations against the branch
 */

import { parseArgs, ENVIRONMENT_BRANCHES, type Environment } from './neon-utils';

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step: number, message: string) {
  log(`\n[Step ${step}] ${message}`, 'blue');
}

async function main() {
  try {
    log('🚀 Neon Setup Script for Deployment Automation', 'green');

    // Parse arguments
    const { environment } = parseArgs();
    log(`Environment: ${environment}`, 'yellow');

    // Get configuration from environment variables
    const projectId = process.env.NEON_PROJECT_ID;
    const apiKey = process.env.NEON_API_KEY;

    if (!projectId) {
      throw new Error('NEON_PROJECT_ID environment variable is required');
    }
    if (!apiKey) {
      throw new Error('NEON_API_KEY environment variable is required');
    }

    const branchName = ENVIRONMENT_BRANCHES[environment];
    log(`Target branch: ${branchName}`, 'yellow');

    // Step 1: Check if branch exists (using Neon MCP)
    logStep(1, 'Checking Neon branches...');
    log(`Project ID: ${projectId}`);
    log('Branch check will be performed via Neon MCP in GitHub Actions context');

    // Step 2: Get connection string
    logStep(2, 'Getting connection string...');
    log('Connection string retrieval via Neon MCP');

    // Step 3: Run migrations
    logStep(3, 'Running migrations...');
    log('This will be done after DATABASE_URL is set');

    log('\n✅ Neon setup completed successfully!', 'green');

    // Output the branch name for GitHub Actions to capture
    console.log(`neon_branch=${branchName}`);

  } catch (error) {
    if (error instanceof Error) {
      log(`\n❌ Error: ${error.message}`, 'red');
    }
    process.exit(1);
  }
}

main();
```

**Step 2: Add script to package.json**

Read the current package.json to find the scripts section:

```bash
cat backend/package.json
```

Add the `neon:setup` script to the scripts object:

```json
{
  "scripts": {
    "neon:setup": "bun run scripts/setup-neon.ts"
  }
}
```

**Step 3: Make script executable**

```bash
chmod +x backend/scripts/setup-neon.ts
```

**Step 4: Test script locally (should fail without env vars)**

```bash
cd backend
bun run neon:setup --environment=staging
```

Expected: Error about missing `NEON_PROJECT_ID` or `NEON_API_KEY`

**Step 5: Commit**

```bash
git add backend/scripts/setup-neon.ts backend/package.json
git commit -m "feat(neon): add main setup script for Neon branches

Add script that:
- Parses --environment argument
- Validates Neon configuration
- Outputs branch info for GitHub Actions

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Integrate Neon MCP Tools in Setup Script

**Files:**
- Modify: `backend/scripts/setup-neon.ts`

**Step 1: Add Neon MCP tool calls**

Update the script to actually call Neon MCP tools. Add these imports and functions:

```typescript
// Add after existing imports in setup-neon.ts

// In a real GitHub Actions environment, we'd call Neon MCP tools
// For now, we'll use direct API calls or CLI
interface NeonBranch {
  id: string;
  name: string;
  current_state: string;
}

async function listNeonBranches(projectId: string, apiKey: string): Promise<NeonBranch[]> {
  // This would use the Neon MCP: mcp__Neon__describe_project
  // For implementation, we'll use neonctl or HTTP API
  log('Listing branches via Neon API...');

  // Using fetch to call Neon API
  const response = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/branches`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list branches: ${response.statusText}`);
  }

  const data = await response.json();
  return data.branches || [];
}

async function createNeonBranch(projectId: string, apiKey: string, branchName: string, parentId: string): Promise<NeonBranch> {
  log(`Creating branch "${branchName}" from parent "${parentId}"...`);

  const response = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/branches`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      branch: {
        name: branchName,
        parent_id: parentId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create branch: ${response.statusText}`);
  }

  const data = await response.json();
  return data.branch;
}

async function getConnectionString(projectId: string, apiKey: string, branchId: string): Promise<string> {
  log('Getting connection string...');

  const response = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}/connection-string`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get connection string: ${response.statusText}`);
  }

  const data = await response.json();
  // Neon returns: { "connection_uri": "postgresql://..." }
  return data.connection_uri || data.uri || '';
}
```

**Step 2: Update main() function to use these helpers**

Replace the placeholder sections in `main()` with actual API calls:

```typescript
async function main() {
  try {
    log('🚀 Neon Setup Script for Deployment Automation', 'green');

    const { environment } = parseArgs();
    log(`Environment: ${environment}`, 'yellow');

    const projectId = process.env.NEON_PROJECT_ID;
    const apiKey = process.env.NEON_API_KEY;

    if (!projectId) throw new Error('NEON_PROJECT_ID is required');
    if (!apiKey) throw new Error('NEON_API_KEY is required');

    const branchName = ENVIRONMENT_BRANCHES[environment];

    // Step 1: Check and create branch if needed
    logStep(1, 'Checking Neon branches...');
    const branches = await listNeonBranches(projectId, apiKey);
    log(`Found ${branches.length} existing branches`);

    const existingBranch = branches.find(b => b.name === branchName);

    let branchId: string;
    if (existingBranch) {
      branchId = existingBranch.id;
      log(`Branch "${branchName}" already exists (${existingBranch.current_state})`, 'green');
    } else {
      // Find the primary/production branch as parent
      const primaryBranch = branches.find(b => b.primary || b.name === 'production' || b.name === 'br-diffusion');
      if (!primaryBranch) {
        throw new Error('No parent branch found to create from');
      }

      log(`Creating "${branchName}" branch from "${primaryBranch.name}"...`);
      const newBranch = await createNeonBranch(projectId, apiKey, branchName, primaryBranch.id);
      branchId = newBranch.id;
      log(`Branch created: ${branchId} (${newBranch.current_state})`, 'green');
    }

    // Step 2: Get connection string
    logStep(2, 'Getting connection string...');
    const connectionString = await getConnectionString(projectId, apiKey, branchId);
    log(`Connection string retrieved (length: ${connectionString.length})`, 'green');

    // Set DATABASE_URL for migrations
    process.env.DATABASE_URL = connectionString;

    // Step 3: Run migrations
    logStep(3, 'Running migrations...');
    const { spawn } = await import('child_process');

    await new Promise<void>((resolve, reject) => {
      const migrate = spawn('bun', ['run', 'db:migrate'], {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: connectionString },
      });

      migrate.on('close', (code) => {
        if (code === 0) {
          log('Migrations completed successfully!', 'green');
          resolve();
        } else {
          reject(new Error(`Migrations failed with code ${code}`));
        }
      });
    });

    log('\n✅ Neon setup completed successfully!', 'green');
    log(`Branch: ${branchName}`, 'yellow');
    log(`Branch ID: ${branchId}`, 'yellow');

    // GitHub Actions can capture this
    console.log(`neon_branch=${branchName}`);
    console.log(`neon_branch_id=${branchId}`);

  } catch (error) {
    if (error instanceof Error) {
      log(`\n❌ Error: ${error.message}`, 'red');
      console.error(error);
    }
    process.exit(1);
  }
}
```

**Step 3: Test script structure (without actual API call)**

```bash
cd backend
bun run typecheck
```

Expected: No type errors

**Step 4: Commit**

```bash
git add backend/scripts/setup-neon.ts
git commit -m "feat(neon): integrate Neon API calls in setup script

Add functions to:
- List existing Neon branches
- Create new branch from parent if needed
- Get connection string for branch
- Run migrations with correct DATABASE_URL

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Update deploy-staging.yml Workflow

**Files:**
- Modify: `.github/workflows/deploy-staging.yml`

**Step 1: Read current workflow**

```bash
cat .github/workflows/deploy-staging.yml
```

**Step 2: Replace with updated workflow**

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: |
          cd backend
          bun install

      - name: Setup Neon & run migrations
        run: |
          cd backend
          bun run neon:setup --environment=staging
        env:
          NEON_PROJECT_ID: ${{ secrets.NEON_PROJECT_ID }}
          NEON_API_KEY: ${{ secrets.NEON_API_KEY }}

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        run: |
          docker build -t amiyokm/todo-backend:staging ./backend
          docker push amiyokm/todo-backend:staging

      - name: Smoke tests
        run: |
          echo "Run smoke tests against staging"
          # TODO: Add actual smoke tests against staging URL
          # curl -f https://staging-url.railway.app/health || exit 1
```

**Step 3: Validate YAML syntax**

```bash
# Use a YAML linter or just check basic syntax
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy-staging.yml'))"
```

Or use:

```bash
cat .github/workflows/deploy-staging.yml | grep -E "^  [a-z]+:" | head -20
```

**Step 4: Commit**

```bash
git add .github/workflows/deploy-staging.yml
git commit -m "ci(staging): update workflow to use Neon setup script

Changes:
- Add Bun setup step
- Add Neon setup and migration step
- Keep Docker build and push
- Placeholder for smoke tests

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Update deploy-production.yml Workflow

**Files:**
- Modify: `.github/workflows/deploy-production.yml`

**Step 1: Read current workflow**

```bash
cat .github/workflows/deploy-production.yml
```

**Step 2: Replace with updated workflow**

```yaml
name: Deploy to Production

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: |
          cd backend
          bun install

      - name: Setup Neon & run migrations
        run: |
          cd backend
          bun run neon:setup --environment=production
        env:
          NEON_PROJECT_ID: ${{ secrets.NEON_PROJECT_ID }}
          NEON_API_KEY: ${{ secrets.NEON_API_KEY }}

      - name: Create version tag
        id: tag
        run: |
          TAG=v$(date +%Y.%m.%d-%H%M%S)
          echo "tag=$TAG" >> $GITHUB_OUTPUT
          git tag $TAG
          git push origin $TAG

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker images
        run: |
          docker build -t amiyokm/todo-backend:production -t amiyokm/todo-backend:latest ./backend
          docker push amiyokm/todo-backend:production
          docker push amiyokm/todo-backend:latest

      - name: Health check
        run: |
          echo "Run health checks against production"
          # TODO: Add actual health checks against production URL
          # curl -f https://production-url.railway.app/health || exit 1
```

**Step 3: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy-production.yml'))" 2>&1 || true
```

**Step 4: Commit**

```bash
git add .github/workflows/deploy-production.yml
git commit -m "ci(production): update workflow to use Neon setup script

Changes:
- Add Bun setup step
- Add Neon setup and migration step
- Keep version tagging and Docker build/push
- Placeholder for health checks

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Create Setup Documentation

**Files:**
- Create: `backend/scripts/README.md`

**Step 1: Write scripts documentation**

```markdown
# Deployment Scripts

This directory contains automation scripts for CI/CD deployment.

## setup-neon.ts

Automates Neon database branch setup and migrations for deployment.

### Usage

```bash
bun run neon:setup --environment=staging|production
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEON_PROJECT_ID` | Yes | Neon project ID |
| `NEON_API_KEY` | Yes | Neon API key for authentication |

### What It Does

1. Validates environment argument (staging/production)
2. Lists existing Neon branches via API
3. Creates staging branch if it doesn't exist (one-time)
4. Retrieves connection string for the branch
5. Runs migrations using the branch's connection string

### Neon API

Uses the Neon REST API directly:
- `GET /api/v2/projects/{id}/branches` - List branches
- `POST /api/v2/projects/{id}/branches` - Create branch
- `GET /api/v2/projects/{id}/branches/{id}/connection-string` - Get connection

### Exit Codes

- `0` - Success
- `1` - Error (check error message)

### Output

The script outputs:
- `neon_branch=<name>` - Branch name for GitHub Actions
- `neon_branch_id=<id>` - Branch ID for reference
```

**Step 2: Commit**

```bash
git add backend/scripts/README.md
git commit -m "docs(scripts): add documentation for Neon setup script

Document usage, environment variables, and API integration.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Create Deployment Setup Guide

**Files:**
- Modify: `docs/DEPLOYMENT.md` (append GitHub Actions section)

**Step 1: Read current deployment docs**

```bash
cat docs/DEPLOYMENT.md
```

**Step 2: Add GitHub Actions section at the end**

```markdown
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
```

**Step 3: Commit**

```bash
git add docs/DEPLOYMENT.md
git commit -m "docs(deploy): add GitHub Actions automation section

Document automated deployment flow via GitHub Actions,
including required secrets and monitoring steps.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Update Railway Environment Variables

**Manual Task (Railway Dashboard)**

This task is done manually in the Railway dashboard.

### Step 1: Log into Railway

Visit [railway.app](https://railway.app) and log in.

### Step 2: Create/update services

Ensure you have two services:
- `todo-api-staging`
- `todo-api-production`

### Step 3: Configure staging environment variables

For the `todo-api-staging` service, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Get from Neon staging branch connection string |
| `JWT_SECRET` | Generate a random secret (e.g., `openssl rand -base64 32`) |
| `NODE_ENV` | `staging` |
| `PORT` | `3000` |

### Step 4: Configure production environment variables

For the `todo-api-production` service, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Get from Neon production branch connection string |
| `JWT_SECRET` | Generate a different random secret |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

### Step 5: Enable auto-deploy from Docker Hub

For each service:
1. Go to service settings
2. Set image source to Docker Hub
3. Configure to watch `amiyokm/todo-backend:staging` or `:production`

### Step 6: Note the Railway URLs

Copy your service URLs:
- Staging: `https://staging-url.railway.app`
- Production: `https://production-url.railway.app`

You'll use these for smoke tests and health checks.

---

## Task 9: Configure GitHub Secrets

**Manual Task (GitHub Repository Settings)**

### Step 1: Go to repository settings

In GitHub, go to:
`Settings` → `Secrets and variables` → `Actions`

### Step 2: Add NEON_PROJECT_ID

1. Click "New repository secret"
2. Name: `NEON_PROJECT_ID`
3. Value: `sparkling-voice-51393485`
4. Click "Add secret"

### Step 3: Generate and add NEON_API_KEY

1. Go to [neon.tech](https://neon.tech)
2. Click your account → "API Keys"
3. Generate new API key
4. Copy the key
5. In GitHub, add secret `NEON_API_KEY` with the key value

### Step 4: Add DOCKER_USERNAME

1. Name: `DOCKER_USERNAME`
2. Value: `amiyokm`

### Step 5: Generate and add DOCKER_PASSWORD

1. Go to [Docker Hub](https://hub.docker.com)
2. Account Settings → Security → Access Tokens
3. Generate new token
4. Copy the token
5. In GitHub, add secret `DOCKER_PASSWORD` with the token value

### Step 6: Verify all secrets

You should have 4 secrets configured:
- ✅ NEON_PROJECT_ID
- ✅ NEON_API_KEY
- ✅ DOCKER_USERNAME
- ✅ DOCKER_PASSWORD

---

## Task 10: Test Staging Deployment

**Verification Task**

### Step 1: Create a test branch and push to develop

```bash
git checkout develop
git pull origin develop
# Make a small change if needed
git push origin develop
```

### Step 2: Monitor GitHub Actions

1. Go to repository "Actions" tab
2. Click on the running "Deploy to Staging" workflow
3. Watch each step:
   - ✅ Checkout
   - ✅ Setup Bun
   - ✅ Install dependencies
   - ✅ Setup Neon & run migrations
   - ✅ Login to Docker Hub
   - ✅ Build and push
   - ✅ Smoke tests

### Step 3: Verify in Neon console

1. Go to [neon.tech](https://neon.tech)
2. Open `staging_tutorial` project
3. Check that `staging` branch exists
4. Verify it has the latest schema

### Step 4: Verify in Railway

1. Go to Railway dashboard
2. Check `todo-api-staging` service
3. Verify deployment completed
4. Check logs for any errors

### Step 5: Test the staging endpoint

```bash
# Health check
curl https://your-staging-url.railway.app/health

# Should return: {"status":"ok"} or similar
```

### Step 6: Commit smoke test command

Update `deploy-staging.yml` with actual smoke test:

```yaml
- name: Smoke tests
  run: |
    curl -f https://your-staging-url.railway.app/health || exit 1
```

```bash
git add .github/workflows/deploy-staging.yml
git commit -m "ci(staging): add actual smoke test URL"
```

---

## Task 11: Test Production Deployment

**Verification Task**

### Step 1: Merge to master

```bash
git checkout master
git merge develop
git push origin master
```

### Step 2: Monitor GitHub Actions

1. Watch the "Deploy to Production" workflow
2. Verify all steps complete
3. Note the version tag created

### Step 3: Verify in Neon console

Check `production` branch has migrations applied.

### Step 4: Verify in Railway

Check `todo-api-production` service deployed successfully.

### Step 5: Test production endpoint

```bash
curl https://your-production-url.railway.app/health
```

### Step 6: Commit health check command

Update `deploy-production.yml`:

```yaml
- name: Health check
  run: |
    curl -f https://your-production-url.railway.app/health || exit 1
```

```bash
git add .github/workflows/deploy-production.yml
git commit -m "ci(production): add actual health check URL"
```

---

## Task 12: Create Deployment Troubleshooting Guide

**Files:**
- Create: `docs/DEPLOYMENT_TROUBLESHOOTING.md`

**Step 1: Write troubleshooting guide**

```markdown
# Deployment Troubleshooting

## GitHub Actions Failures

### "NEON_API_KEY not found"

**Cause:** GitHub secret not configured

**Fix:**
1. Go to repository Settings → Secrets → Actions
2. Add `NEON_API_KEY` secret

### "Docker login failed"

**Cause:** Invalid Docker Hub credentials

**Fix:**
1. Verify `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets
2. Regenerate Docker Hub access token if needed

### "Migration failed"

**Cause:** Database connection issue or schema conflict

**Fix:**
1. Check Neon console - verify branch exists
2. Check DATABASE_URL format (must include `?sslmode=require`)
3. Review migration SQL in `drizzle` folder

## Railway Issues

### Deployment not triggering

**Cause:** Railway not watching Docker Hub tag

**Fix:**
1. Check service settings in Railway
2. Verify image source is set to Docker Hub
3. Check tag name matches (`:staging` or `:production`)

### Health check failing

**Cause:** App not starting or DATABASE_URL misconfigured

**Fix:**
1. Check Railway service logs
2. Verify DATABASE_URL includes correct Neon branch
3. Ensure Railway env vars match Neon connection strings

## Neon Issues

### Branch not found

**Cause:** Branch creation failed or wrong project ID

**Fix:**
1. Verify `NEON_PROJECT_ID` is correct
2. Check Neon console for branch
3. Manually create branch if needed

### Connection refused

**Cause:** IP restrictions or wrong connection string

**Fix:**
1. Ensure connection string includes `?sslmode=require`
2. Check Neon project IP allowlist settings
3. Verify branch is in "ready" state

## Getting Logs

### GitHub Actions
```bash
gh run view --log-failed
```

### Railway
```bash
railway logs --service=staging
railway logs --service=production
```

### Neon
Check browser console logs at neon.tech
```

**Step 2: Commit**

```bash
git add docs/DEPLOYMENT_TROUBLESHOOTING.md
git commit -m "docs(deploy): add troubleshooting guide

Cover common issues with GitHub Actions, Railway, and Neon.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Summary

After completing all tasks:

1. ✅ Neon setup script created and integrated
2. ✅ GitHub Actions workflows updated
3. ✅ Documentation completed
4. ✅ Railway configured manually
5. ✅ GitHub secrets configured manually
6. ✅ Staging deployment tested
7. ✅ Production deployment tested

**Total estimated tasks:** 12
**Estimated time:** 2-3 hours (including manual verification steps)

---

## Final Checklist

Before considering the implementation complete:

- [ ] All scripts pass typecheck
- [ ] All workflows have valid YAML
- [ ] GitHub secrets are configured
- [ ] Railway services are configured
- [ ] Neon branches exist (staging + production)
- [ ] Staging deployment tested successfully
- [ ] Production deployment tested successfully
- [ ] Health checks pass
- [ ] Documentation is up to date
