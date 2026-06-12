level: patch
audience: developers
---
The web client (`@taskcluster/client-web`) now depends on query-string v9.
query-string v8+ is a pure ESM package using modern JavaScript syntax, so the
client's webpack/karma build was updated to transpile it (and its ESM
dependencies) and `Client.js` now uses the v9 default-export API. This is an
internal build change with no effect on the client's public API.
