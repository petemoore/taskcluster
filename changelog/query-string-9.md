level: patch
audience: developers
---
The `@taskcluster/client-web` package now depends on `query-string` 9.x. The
upgrade required adapting to query-string's pure-ESM, default-only export shape
(`import queryString from 'query-string'` instead of a named `stringify`
import); generated query strings are unchanged. The karma test build now
transpiles query-string and its pure-ESM dependencies so webpack 4 can bundle
their modern syntax.
