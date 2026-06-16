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
            // query-string@9 and its pure-ESM dependencies use modern syntax
            // (optional chaining / nullish coalescing) that webpack 4's parser
            // cannot handle. Transpile them with babel so the bundle builds.
            test: /\.js$/,
            include: /node_modules[\\/](query-string|decode-uri-component|split-on-first|filter-obj)[\\/]/,
            use: {
              loader: 'babel-loader',
              options: {
                // Target IE11 to force preset-env to down-level the optional
                // chaining / nullish coalescing in these deps. Modern browser
                // targets would leave that syntax intact (browsers support it
                // natively), but webpack 4's parser still cannot handle it.
                presets: [['@babel/preset-env', { targets: { ie: '11' } }]],
                babelrc: false,
                configFile: false,
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
