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
            // query-string v9 and its deps are pure ESM and use modern JS
            // syntax (optional chaining, nullish coalescing, logical assignment)
            // that webpack 4's acorn parser cannot handle. Run them through
            // babel-loader so they are transformed before webpack parses them.
            test: /\.js$/,
            include: [
              /node_modules[\\/](query-string|decode-uri-component|filter-obj|split-on-first)[\\/]/,
            ],
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['@babel/preset-env', {
                    // Target an environment that predates optional chaining
                    // and logical-assignment support so that babel always
                    // down-transpiles those constructs, making the output
                    // parseable by webpack 4's acorn 6 parser.
                    targets: { node: '12' },
                  }],
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
