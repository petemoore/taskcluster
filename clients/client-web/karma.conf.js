process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = config => {
  return config.set({
    frameworks: ['mocha'],
    files: [
      {
        pattern: 'test/*_test.js',
        watched: false,
        included: true,
        served: true,
      },
    ],
    preprocessors: {
      // karma-webpack v5 adds commons.js and runtime.js (webpack output files)
      // to config.files; using '**/*.js' would match those too, causing the
      // preprocessor to fail (it can't look them up by hash in bundlesContent).
      // Restrict to test files only, as karma-webpack v5 expects.
      'test/*_test.js': ['webpack'],
    },
    webpackMiddleware: {
      stats: {
        all: false,
        errors: true,
        timings: true,
        warnings: true,
      },
    },
    webpack: {
      mode: 'development',
      plugins: [
        // Webpack 5 no longer polyfills Node.js core modules automatically.
        // NodePolyfillPlugin restores that behaviour, which is required by hawk
        // (used for HMAC request signing in the browser).
        //
        // Exclude the 'Buffer' global-inject alias: the plugin provides Buffer via
        // ProvidePlugin using an absolute directory path, and chai 6 (pure ESM)
        // requires fully-specified paths. Excluding the global inject avoids the
        // resolution error; resolve.fallback.buffer (lowercase) still works for
        // require('buffer') inside dependencies like crypto-browserify.
        new NodePolyfillPlugin({ excludeAliases: ['Buffer'] }),
      ],
    },
    reporters: ['mocha'],
    browsers: [process.env.CI ? 'FirefoxHeadless' : 'Firefox'],
    client: {
      args: [process.env.TASKCLUSTER_ROOT_URL],
    },
  });
};
