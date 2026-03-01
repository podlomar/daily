#!/bin/bash
set -e

HOST=podlomar@daily.podlomar.me
REMOTE=$HOST:/var/www/daily.podlomar.me

# Build
echo "Building project..."
npm run build
(cd frontend && npm run build)

# Sync
echo "Syncing files to server..."
rsync -avz --delete dist/ "$REMOTE/dist/"
rsync -avz --delete frontend/dist/ "$REMOTE/frontend/dist/"
rsync -avz --exclude '*.sqlite' data/ "$REMOTE/data/"
rsync -avz package.json package-lock.json "$REMOTE/"

# Install production dependencies on server
echo "Installing production dependencies on server..."
ssh "$HOST" "bash -lc 'cd /var/www/daily.podlomar.me && npm install --omit=dev'"

echo "Deployment complete. Restarting server..."
# Restart server
ssh "$HOST" "bash -lc 'sudo systemctl restart daily'"

echo "Done."
