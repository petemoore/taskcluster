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
      '**/*.js': ['webpack'],
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
        new NodePolyfillPlugin(),
      ],
    },
    reporters: ['mocha'],
    browsers: [process.env.CI ? 'FirefoxHeadless' : 'Firefox'],
    client: {
      args: [process.env.TASKCLUSTER_ROOT_URL],
    },
  });
};
