#!/usr/bin/env sh
set -e

# Run database migrations and seed if not skipped
if [ "${SKIP_MIGRATIONS:-0}" != "1" ]; then
  echo "Running Prisma migrations..."
  # Use npx to execute prisma from node_modules
  if command -v npx >/dev/null 2>&1; then
    npx prisma migrate deploy || {
      echo "Prisma migrate deploy failed" >&2
      exit 1
    }

    # Run seed if seed script exists
    if [ -f prisma/seed.ts ] || grep -q "db seed" package.json 2>/dev/null; then
      echo "Running Prisma seed..."
      # If seed is TypeScript, run with ts-node or node after build; prefer npm script
      if npm run | grep -q "db seed"; then
        npm run prisma:seed 2>/dev/null || true
      else
        npx prisma db seed || true
      fi
    fi
  else
    echo "npx not available, skipping migrations" >&2
  fi
else
  echo "SKIP_MIGRATIONS=1 set, skipping migrations"
fi

exec "$@"
