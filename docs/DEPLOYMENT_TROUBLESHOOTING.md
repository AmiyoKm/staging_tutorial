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
