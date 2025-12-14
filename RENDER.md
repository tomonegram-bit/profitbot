Render Deployment Quickstart
===========================

This file explains how to deploy the profitbot monorepo to Render using the included `render.yaml` manifest.

What the manifest does
- Defines three services that build from the repository Dockerfiles:
  - `profitbot-frontend` -> Dockerfile.frontend
  - `profitbot-backend`  -> Dockerfile.backend
  - `profitbot-bot`      -> Dockerfile.bot (worker)

Quick steps
1. In Render, create a new service and connect your GitHub repository `tomonegram-bit/profitbot`.
2. Choose the option to import from `render.yaml` so Render creates the three services automatically.
3. For each service, configure environment variables (Settings → Environment):
   - `DATABASE_URL` (Postgres)
   - `REDIS_URL` (Redis)
   - `MASTER_ENCRYPTION_KEY`
   - `JWT_SECRET`
   - `TELEGRAM_TOKEN` (for the bot)
   - Any other secrets from your `.env.local`
4. Provision a managed Postgres and Redis instance in Render (or use external services). Add those connection strings to the backend service environment variables.
5. Deploy. Render will build Docker images and run the services.

Notes & tips
- If your backend requires database migrations or seeding, run them from the Render dashboard's shell for the backend service after the initial deploy:

```bash
npx prisma migrate deploy
npx prisma db seed
```

- Make sure to set `NODE_ENV=production` for services that expect production behavior.
- Monitor service logs in the Render dashboard to troubleshoot connectivity and runtime errors.

Security
- Use Render's encrypted environment variables for secrets.
- Restrict API access and rotate credentials regularly.

Need help?
If you want, I can add an example Nginx reverse-proxy config, automated migration step, or a health-check readiness script to improve reliability on Render.
