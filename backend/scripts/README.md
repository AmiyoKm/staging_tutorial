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
