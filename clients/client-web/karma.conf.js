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
            // query-string@9 and its pure-ESM deps ship modern syntax
            // (optional chaining, nullish coalescing, logical assignment)
            // that webpack 4's bundled acorn 6 cannot parse. Down-level
            // them with babel so the test bundle builds. node_modules is
            // not excluded for these packages so their source is transpiled.
            test: /\.js$/,
            include: [
              /node_modules[\\/](query-string|decode-uri-component|filter-obj|split-on-first)[\\/]/,
            ],
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env'],
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
