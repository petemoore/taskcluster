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
            // query-string v9 (and its dependencies) are pure ESM and use
            // modern syntax such as optional chaining (?.) and nullish
            // coalescing (??). webpack 4 bundles acorn 6, which cannot parse
            // these operators, so we transpile these specific packages through
            // babel. The rest of node_modules is left untouched.
            test: /\.m?js$/,
            include: /node_modules[/\\](query-string|decode-uri-component|filter-obj|split-on-first)[/\\]/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [['@babel/preset-env', { targets: { firefox: '60' } }]],
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
