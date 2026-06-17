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
            // query-string v9 (and its deps decode-uri-component, filter-obj,
            // split-on-first) are pure ESM and use modern syntax (optional
            // chaining, nullish coalescing) in node_modules. webpack 4 ships
            // acorn 6, which cannot parse it, so transpile them with babel.
            test: /\.js$/,
            include: /node_modules[\\/](query-string|decode-uri-component|filter-obj|split-on-first)[\\/]/,
            use: {
              loader: 'babel-loader',
              options: {
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
