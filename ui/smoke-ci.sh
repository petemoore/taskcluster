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

# Wait for the dev server to finish the initial compilation and start
# serving.  webpack-dev-middleware (used by webpack-dev-server v5)
# holds HTTP connections until compilation is complete, so a successful
# HTTP response implies the bundle is fully emitted and ready.
timeout 300 bash -c "until curl -sf --max-time 10 http://localhost:${PORT}/ -o /dev/null; do sleep 2; done"

BASE_URL="http://localhost:${PORT}" yarn smoke
