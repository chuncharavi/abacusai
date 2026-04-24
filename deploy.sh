#!/bin/bash
set -e

echo "=== AbacusAI — DigitalOcean Deploy Script ==="

# Check .env exists
if [ ! -f .env ]; then
  echo "ERROR: .env file not found."
  echo "Copy .env.example to .env and fill in your values first:"
  echo "  cp .env.example .env && nano .env"
  exit 1
fi

# Check required vars
source .env
for VAR in POSTGRES_PASSWORD SESSION_SECRET ANTHROPIC_API_KEY; do
  if [ -z "${!VAR}" ]; then
    echo "ERROR: $VAR is not set in .env"
    exit 1
  fi
done

echo ""
echo "1. Pulling latest code..."
git pull origin main

echo ""
echo "2. Building Docker images..."
docker compose build --no-cache

echo ""
echo "3. Starting database..."
docker compose up -d postgres
echo "   Waiting for PostgreSQL to be ready..."
sleep 5

echo ""
echo "4. Running database migrations..."
docker compose run --rm migrate

echo ""
echo "5. Starting all services..."
docker compose up -d

echo ""
echo "6. Checking health..."
sleep 5
docker compose ps

echo ""
echo "=== Deployment complete! ==="
echo "Your app is running at: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f api    — stream API logs"
echo "  docker compose logs -f web    — stream web logs"
echo "  docker compose down           — stop everything"
echo "  docker compose restart api    — restart API only"
