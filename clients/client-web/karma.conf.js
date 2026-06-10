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
            // query-string v9+ and its dependencies are pure ESM and use modern JS
            // syntax (optional chaining, nullish coalescing) that webpack 4's acorn
            // parser cannot handle. Use babel-loader to transpile them first.
            test: /\.js$/,
            include: /node_modules[\\/](query-string|filter-obj|split-on-first|decode-uri-component)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['@babel/preset-env', {
                    // No targets specified: babel transforms all modern syntax
                    // (including optional chaining ?. and nullish coalescing ??)
                    // to ES5-compatible code that webpack 4's acorn parser can handle.
                    modules: 'commonjs',
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
