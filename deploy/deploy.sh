#!/bin/bash

REMOTE=podlomar@dailyapi.podlomar.me:/var/www/dailyapi.podlomar.me

# Build frontend
(cd frontend && npm run build)

rsync -avz --delete dist/ "$REMOTE/dist/"
rsync -avz --delete frontend/dist/ "$REMOTE/frontend/dist/"
rsync -avz --exclude '*.sqlite' data/ "$REMOTE/data/"
rsync -avz package.json package-lock.json "$REMOTE/"
