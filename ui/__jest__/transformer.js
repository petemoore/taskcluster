// babel-jest v30 uses the Jest 27+ transformer API where getCacheKey and process
// receive (sourceText, sourcePath, transformOptions) with transformOptions being an
// object that includes { config, configString, instrument }.
//
// Jest 26 (still used as the test runner) calls the old API:
//   getCacheKey(fileData, filePath, configString, { config, instrument, rootDir })
//   process(sourceText, sourcePath, { config, instrument, ... })
//
// This wrapper detects the Jest 26 call shape and adapts it to what babel-jest v30
// expects, bridging the API gap until jest itself is upgraded to v27+.

// babel-jest v30 ships as an ES module compiled to CJS; use .default if present.
const babelJestMod = require('babel-jest');
const babelJest = babelJestMod.default || babelJestMod;

const jestBabelOptions = {
  babelrc: false,
  configFile: false,
  presets: [
    [
      '@babel/preset-env',
      {
        debug: false,
        useBuiltIns: false,
        shippedProposals: true,
        targets: {
          browsers: [
            'last 2 Chrome versions',
            'last 2 Firefox versions',
            'last 2 Edge versions',
            'last 2 Opera versions',
            'last 2 Safari versions',
            'last 2 iOS versions',
          ],
        },
      },
    ],
    [
      '@babel/preset-react',
      {
        development: true,
        useSpread: true,
      },
    ],
  ],
    plugins: [
        "@babel/plugin-syntax-dynamic-import",
        [
            "transform-react-remove-prop-types",
            {
                removeImport: true,
            },
        ],
        [
            "@babel/plugin-proposal-decorators",
            {
                legacy: true,
            },
        ],
        [
            "@babel/plugin-proposal-class-properties",
            {
                loose: false,
            },
        ],
        [
            "@babel/plugin-proposal-optional-chaining",
            {
                loose: true,
            },
        ],
        [
            "@babel/plugin-proposal-nullish-coalescing-operator",
            {
                loose: true,
            },
        ],
        [
            "@babel/plugin-transform-modules-commonjs",
            {
                loose: true,
            },
        ],
    ],
};

const innerTransformer = babelJest.createTransformer(jestBabelOptions);

/**
 * Normalise a getCacheKey / process call from Jest 26's 4-arg convention to the
 * Jest 27+ 3-arg convention that babel-jest v30 requires.
 *
 * Jest 26:  fn(fileData, filePath, configString, { config, instrument, rootDir })
 * Jest 27+: fn(fileData, filePath, { config, configString, instrument, ... })
 *
 * The key requirement for babel-jest v30 is that transformOptions.config.cwd
 * exists; Jest 26's config object uses rootDir but does not always populate cwd.
 */
function normaliseTransformOptions(configStringOrOptions, legacyOptions) {
  if (typeof configStringOrOptions === 'string') {
    // Jest 26 style: third arg is the raw configString, fourth arg carries options.
    const config = (legacyOptions && legacyOptions.config) ? Object.assign({}, legacyOptions.config) : {};
    if (!config.cwd) {
      // babel-jest v30 requires config.cwd; fall back to rootDir or process.cwd().
      config.cwd = config.rootDir || process.cwd();
    }
    return Object.assign({}, legacyOptions, {
      config,
      configString: configStringOrOptions,
    });
  }

  // Jest 27+ style: third arg is already the transformOptions object.
  // Still ensure config.cwd exists in case jest has not set it.
  const opts = configStringOrOptions || {};
  if (opts.config && !opts.config.cwd) {
    return Object.assign({}, opts, {
      config: Object.assign({}, opts.config, {
        cwd: opts.config.rootDir || process.cwd(),
      }),
    });
  }
  return opts;
}

module.exports = Object.assign({}, innerTransformer, {
  getCacheKey(fileData, filePath, configStringOrOptions, legacyOptions) {
    const transformOptions = normaliseTransformOptions(configStringOrOptions, legacyOptions);
    return innerTransformer.getCacheKey(fileData, filePath, transformOptions);
  },
  process(sourceText, sourcePath, configStringOrOptions, legacyOptions) {
    const transformOptions = normaliseTransformOptions(configStringOrOptions, legacyOptions);
    return innerTransformer.process(sourceText, sourcePath, transformOptions);
  },
});
