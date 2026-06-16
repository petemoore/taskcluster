level: patch
audience: developers
reference: issue 270
---
The Taskcluster UI build has been upgraded from webpack 4 to webpack 5. This
was required to adopt `babel-loader` 10, which dropped support for webpack 4.
Several related build dependencies were upgraded as well (`webpack-cli`,
`webpack-dev-server`, `html-webpack-plugin`, `mini-css-extract-plugin`,
`copy-webpack-plugin`, `css-loader`, and `html-loader`), and the webpack
configuration was updated for the webpack 5 APIs (Node core module polyfills,
`output.clean`, the CopyPlugin `patterns` API, and the dev-server `proxy`
array form). This is a developer/build-tooling change with no user-facing
behaviour change.
