#!/bin/bash
# Apply Prisma migrations to Supabase (run locally, one-time setup)
# Usage: ./scripts/apply-migrations.sh
# Or: DATABASE_URL=... DIRECT_URL=... ./scripts/apply-migrations.sh

set -e
cd "$(dirname "$0")/../apps/api"

if [ -z "$DATABASE_URL" ] || [ -z "$DIRECT_URL" ]; then
  echo "Set DATABASE_URL and DIRECT_URL (from Supabase Dashboard → Database → Connection string)"
  echo ""
  echo "Example:"
  echo '  export DIRECT_URL="postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres"'
  echo '  export DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"'
  echo '  ./scripts/apply-migrations.sh'
  exit 1
fi

echo "Applying migrations..."
npx prisma migrate deploy

echo "Done. Tables created. Optionally run: npx prisma db seed"
read -p "Seed demo data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npx prisma db seed
fi
