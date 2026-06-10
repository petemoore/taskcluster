process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const webpack = require('webpack');
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
        // Exclude 'Buffer' and 'process' global-inject aliases:
        // NodePolyfillPlugin provides them via ProvidePlugin using absolute
        // *directory* paths, and chai 6 (pure ESM) requires fully-specified
        // paths with file extensions, so those injections crash. We re-add
        // both below using require.resolve(), which resolves to exact file
        // paths at config-load time, satisfying webpack 5's ESM
        // fully-specified-path requirement.
        //
        // Note: 'process' is also not in NodePolyfillPlugin's defaultPolyfills
        // set, so it would never be injected by the plugin regardless; the
        // explicit ProvidePlugin entry below is the sole injection point.
        new NodePolyfillPlugin({ excludeAliases: ['Buffer', 'process'] }),
        new webpack.ProvidePlugin({
          Buffer: [require.resolve('buffer/'), 'Buffer'],
          process: require.resolve('process/browser.js'),
        }),
      ],
    },
    reporters: ['mocha'],
    browsers: [process.env.CI ? 'FirefoxHeadless' : 'Firefox'],
    client: {
      args: [process.env.TASKCLUSTER_ROOT_URL],
    },
  });
};
