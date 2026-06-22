level: patch
audience: developers
---
The `@taskcluster/client-web` package's `query-string` dependency was upgraded
from 7.1.1 to 9.3.1. query-string is now pure ESM and exposes only a default
export, so `Client.js` was updated to use a default import (the previous named
`{ stringify }` import no longer resolves). The karma/webpack test build was
also updated to transpile query-string (and its modern-syntax ESM dependencies)
with babel, since webpack 4's bundled acorn parser cannot handle optional
chaining / nullish coalescing. `stringify` output is unchanged.
