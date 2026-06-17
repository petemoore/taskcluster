level: silent
---
Updated `@taskcluster/client-web` for query-string 9.x (pure ESM): switched to
the default import (`queryString.stringify`) since v9's entry no longer exposes
named exports, and taught the karma/webpack 4 test build to transpile
query-string's modern syntax via babel-loader.
