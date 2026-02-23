#!/bin/bash
set -e

HOST=podlomar@daily.podlomar.me
REMOTE=$HOST:/var/www/daily.podlomar.me

# Build
npm run build
(cd frontend && npm run build)

# Sync
rsync -avz --delete dist/ "$REMOTE/dist/"
rsync -avz --delete frontend/dist/ "$REMOTE/frontend/dist/"
rsync -avz --exclude '*.sqlite' data/ "$REMOTE/data/"
rsync -avz package.json package-lock.json "$REMOTE/"

# Install production dependencies on server
ssh "$HOST" "cd /var/www/daily.podlomar.me && npm install --omit=dev"
