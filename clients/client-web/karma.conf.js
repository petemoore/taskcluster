process.env.NODE_ENV = process.env.NODE_ENV || 'test';

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
      module: {
        rules: [
          {
            // query-string 9.x and its dependencies are pure ESM and use
            // modern syntax (optional chaining, nullish coalescing) that
            // webpack 4's parser cannot handle. Transpile just those packages
            // with babel so they can be bundled without upgrading webpack
            // (which would otherwise require adding node core polyfills for
            // `hawk`, which relies on `crypto`/`url`).
            test: /\.js$/,
            include: [
              /node_modules[\\/]query-string[\\/]/,
              /node_modules[\\/]decode-uri-component[\\/]/,
              /node_modules[\\/]filter-obj[\\/]/,
              /node_modules[\\/]split-on-first[\\/]/,
            ],
            use: {
              loader: 'babel-loader',
              options: {
                babelrc: false,
                configFile: false,
                // Keep ES module syntax so webpack handles interop/tree-shaking;
                // only down-level the unsupported syntax.
                presets: [['@babel/preset-env', { modules: false }]],
              },
            },
          },
        ],
      },
    },
    reporters: ['mocha'],
    browsers: [process.env.CI ? 'FirefoxHeadless' : 'Firefox'],
    client: {
      args: [process.env.TASKCLUSTER_ROOT_URL],
    },
  });
};
