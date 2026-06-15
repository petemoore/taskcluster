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
            // query-string v9+ is pure ESM and uses modern syntax (optional
            // chaining `?.` and nullish coalescing `??`) that webpack 4's
            // parser cannot handle. Transpile it and its ESM-only
            // dependencies through babel so the bundle can be built.
            test: /\.js$/,
            include: [
              /node_modules\/query-string/,
              /node_modules\/decode-uri-component/,
              /node_modules\/filter-obj/,
              /node_modules\/split-on-first/,
            ],
            use: {
              loader: 'babel-loader',
              options: {
                babelrc: false,
                configFile: false,
                // Down-level the modern JS syntax (optional chaining,
                // nullish coalescing, logical assignment, etc.) that
                // webpack 4's parser cannot handle. Targeting an older
                // browser forces preset-env to transform these features.
                presets: [
                  ['@babel/preset-env', { targets: { firefox: '60' } }],
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
