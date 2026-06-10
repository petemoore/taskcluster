#!/bin/bash
# Boot the UI dev server and run Playwright smoke tests against it.
# Used by taskcluster CI; runs on port 5081 so it doesn't collide
# with a local `yarn start` on the default 5080.

set -euo pipefail

: "${TASKCLUSTER_ROOT_URL:=https://community-tc.services.mozilla.com}"
: "${PORT:=5081}"
export TASKCLUSTER_ROOT_URL PORT

cleanup() {
  if [[ -n "${DEV_PID:-}" ]]; then
    pkill -P "$DEV_PID" 2>/dev/null || true
    kill "$DEV_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

DEV_LOG=/tmp/dev-server.log
yarn start > "$DEV_LOG" 2>&1 &
DEV_PID=$!

# Wait for the initial webpack build to finish, not just for the port
# to open — webpack-dev-server starts serving before all chunks are
# emitted, which races the smoke harness on a cold CI worker.
timeout 300 bash -c "until grep -qi 'compiled successfully' '$DEV_LOG'; do sleep 2; done"

# Confirm the HTTP server is actually accepting TCP connections.
# webpack-dev-server v5 may bind to an IPv6 dual-stack socket (::) in
# Docker containers where net.ipv6.bindv6only=1 prevents IPv4 clients
# from reaching it; an explicit host:"localhost" in the config forces
# IPv4 binding, but this curl check makes the script fail fast with a
# helpful log dump if the port still isn't reachable for any reason.
timeout 60 bash -c "until curl -sf --max-time 2 http://localhost:${PORT}/ > /dev/null 2>&1; do sleep 1; done" || {
  echo "=== Dev server log (last 60 lines) ===" >&2
  tail -60 "$DEV_LOG" >&2
  echo "Dev server port ${PORT} not reachable after 60 s" >&2
  exit 1
}

BASE_URL="http://localhost:${PORT}" yarn smoke
