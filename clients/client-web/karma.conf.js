const path = require('path');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// query-string v9 (and its dependencies) ship as pure ESM and use modern
// syntax such as optional chaining and nullish coalescing that webpack 4's
// parser cannot handle on its own. Transpile those packages with babel so the
// bundle builds in the browsers we test against.
const esmModulesToTranspile = [
  'query-string',
  'decode-uri-component',
  'filter-obj',
  'split-on-first',
].map(name => path.join('node_modules', name));

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
            test: /\.js$/,
            include: modulePath =>
              esmModulesToTranspile.some(name => modulePath.includes(name)),
            use: {
              loader: 'babel-loader',
              options: {
                babelrc: false,
                configFile: false,
                presets: [
                  ['@babel/preset-env', {
                    targets: { firefox: '78' },
                    // webpack 4's parser cannot handle these ES2020+ syntax
                    // features, so force babel to transpile them even though
                    // the target browser supports them natively.
                    include: [
                      '@babel/plugin-transform-optional-chaining',
                      '@babel/plugin-transform-nullish-coalescing-operator',
                      '@babel/plugin-transform-logical-assignment-operators',
                    ],
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
