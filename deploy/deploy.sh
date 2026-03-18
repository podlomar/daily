#!/bin/bash
set -e

HOST=podlomar@daily.podlomar.me
REMOTE=$HOST:/var/www/daily.podlomar.me

# Colors
BOLD=$'\033[1m'
DIM=$'\033[2m'
GREEN=$'\033[0;32m'
CYAN=$'\033[0;36m'
YELLOW=$'\033[0;33m'
RED=$'\033[0;31m'
RESET=$'\033[0m'

step() {
  echo -e "\n${CYAN}${BOLD}▶ $1${RESET}"
}

ok() {
  echo -e "${GREEN}✔ $1${RESET}"
}

info() {
  echo -e "${DIM}  $1${RESET}"
}

banner() {
  echo -e "${BOLD}"
  echo "╔══════════════════════════════════╗"
  echo "║        daily — deploying         ║"
  echo "╚══════════════════════════════════╝"
  echo -e "${RESET}"
}

# Trap errors
trap 'echo -e "\n${RED}${BOLD}✘ Deploy failed.${RESET}" >&2' ERR

banner

# Build backend
step "Building backend"
npm run build 2>&1 | sed "s/^/${DIM}  /" | sed "s/$/${RESET}/"
ok "Backend built"

# Build frontend
step "Building frontend"
(cd frontend && npm run build) 2>&1 | sed "s/^/${DIM}  /" | sed "s/$/${RESET}/"
ok "Frontend built"

# Sync files
step "Syncing files to ${HOST}"
info "backend dist/"
rsync -az --delete dist/ "$REMOTE/dist/"
info "frontend dist/"
rsync -az --delete frontend/dist/ "$REMOTE/frontend/dist/"
info "data/"
rsync -az --exclude '*.sqlite' data/ "$REMOTE/data/"
info "package files"
rsync -az package.json package-lock.json "$REMOTE/"
ok "Files synced"

# Install dependencies
step "Installing production dependencies on server"
ssh "$HOST" "bash -lc 'cd /var/www/daily.podlomar.me && npm install --omit=dev'" \
  2>&1 | sed "s/^/${DIM}  /" | sed "s/$/${RESET}/"
ok "Dependencies installed"

# Restart
step "Restarting service"
ssh "$HOST" "bash -lc 'sudo systemctl restart daily'"
ok "Service restarted"

echo -e "\n${GREEN}${BOLD}✔ Deploy complete.${RESET}\n"
