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
                    // Target IE 11 to ensure optional chaining (?.) and nullish
                    // coalescing (??) are transformed to syntax that webpack 4's
                    // acorn parser can handle.
                    // modules: false lets webpack 4 handle ESM import/export
                    // natively, avoiding CJS/ESM interop issues that would break
                    // named exports like `stringify`.
                    targets: { ie: 11 },
                    modules: false,
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
