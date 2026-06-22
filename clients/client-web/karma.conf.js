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
            // query-string v9 (and its sindresorhus sub-deps) ship modern
            // syntax (optional chaining `?.`, nullish coalescing `??`) that
            // webpack 4's bundled acorn 6 parser cannot parse. Transpile just
            // those packages down to a target old enough to down-level that
            // syntax so the bundle builds. See changelog for query-string 9.3.1.
            test: /\.js$/,
            include: [
              /node_modules[\\/]query-string[\\/]/,
              /node_modules[\\/]decode-uri-component[\\/]/,
              /node_modules[\\/]split-on-first[\\/]/,
              /node_modules[\\/]filter-obj[\\/]/,
            ],
            use: {
              loader: 'babel-loader',
              options: {
                babelrc: false,
                configFile: false,
                presets: [
                  ['@babel/preset-env', { targets: { ie: '11' } }],
                ],
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
