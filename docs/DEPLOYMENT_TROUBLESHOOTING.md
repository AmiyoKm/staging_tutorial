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

## DigitalOcean Issues

### Deployment not triggering

**Cause:** DigitalOcean app not configured for continuous deployment from Docker Hub

**Fix:**
1. Go to DigitalOcean dashboard → Your app → Settings
2. Verify "Deploy on push" is enabled
3. Check Docker Hub image source is configured correctly
4. Ensure tag name matches (`:staging` or `:production`)

### Health check failing

**Cause:** App not starting or DATABASE_URL misconfigured

**Fix:**
1. Check DigitalOcean app logs (Components → Logs)
2. Verify DATABASE_URL includes correct Neon branch
3. Ensure app env vars match Neon connection strings
4. Check health check path is `/health`

### App crashes on startup

**Cause:** Missing environment variables or port mismatch

**Fix:**
1. Verify all required env vars are set: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`, `PORT`
2. Ensure `PORT` is set to `3000` (matches container port)
3. Check logs for specific error messages

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

### DigitalOcean
```bash
# List apps
doctl apps list

# View logs
doctl apps logs <app-id>

# Stream logs in real-time
doctl apps logs <app-id> --follow
```

### Neon
Check browser console logs at neon.tech
