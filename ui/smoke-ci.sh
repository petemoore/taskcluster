#!/bin/bash
# Build the UI and run Playwright smoke tests against a static server.
# Used by taskcluster CI; runs on port 5081 so it doesn't collide
# with a local `yarn start` on the default 5080.
#
# We use a production build + static file server rather than webpack-dev-server
# to avoid a webpack 5 bug where FileSystemInfo._resolveContextTimestamp crashes
# on some Docker/Linux kernel combinations in watch mode:
#   TypeError: The "data" argument must be of type string or an instance of Buffer
#   at BulkUpdateHash.update (webpack/lib/util/hash/BulkUpdateHash.js)
#   at webpack/lib/FileSystemInfo.js:3905

set -euo pipefail

: "${TASKCLUSTER_ROOT_URL:=https://community-tc.services.mozilla.com}"
: "${PORT:=5081}"
export TASKCLUSTER_ROOT_URL PORT

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Build the production bundle (no file-watching, avoids the webpack 5 CI crash)
GENERATE_ENV_JS=1 yarn build

# Start a minimal SPA-aware static file server on the build directory.
# Routes /docs/* to docs.html, everything else to index.html.
# API paths (/graphql, /login, /api/*, /schemas, /references, /subscription)
# are proxied to TASKCLUSTER_ROOT_URL to match dev-server proxy behaviour.
node - <<JSEOF &
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const buildDir = path.resolve('./build');
const port = parseInt(process.env.PORT) || 5081;
const proxyTarget = process.env.TASKCLUSTER_ROOT_URL || 'https://community-tc.services.mozilla.com';
const parsedTarget = url.parse(proxyTarget);
const useHttps = parsedTarget.protocol === 'https:';

const PROXY_PATHS = ['/graphql', '/login', '/api/', '/schemas', '/references', '/subscription'];
const TYPES = {
  '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function proxyRequest(req, res) {
  const options = {
    hostname: parsedTarget.hostname,
    port: parsedTarget.port || (useHttps ? 443 : 80),
    path: req.url,
    method: req.method,
    headers: Object.assign({}, req.headers, { host: parsedTarget.hostname }),
  };
  const transport = useHttps ? https : http;
  const proxyReq = transport.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ errors: [{ message: 'Proxy error: ' + err.message }] }));
  });
  req.pipe(proxyReq);
}

http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // Proxy API paths to TASKCLUSTER_ROOT_URL
  if (PROXY_PATHS.some(p => urlPath === p || urlPath.startsWith(p))) {
    return proxyRequest(req, res);
  }

  // Serve static files with SPA fallback
  let filePath = path.join(buildDir, urlPath);
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) throw new Error('directory');
  } catch (_) {
    filePath = path.join(buildDir, urlPath.startsWith('/docs') ? 'docs.html' : 'index.html');
  }
  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  } catch (err) {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => process.stderr.write('Static server ready on port ' + port + '\n'));
JSEOF
SERVER_PID=$!

# Wait for the server to start accepting connections
timeout 30 bash -c "until curl -sfo /dev/null 'http://localhost:${PORT}/'; do sleep 1; done"

BASE_URL="http://localhost:${PORT}" yarn smoke
