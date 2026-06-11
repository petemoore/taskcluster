// babel-jest v30 uses the Jest 27+ transformer API where getCacheKey and process
// receive (sourceText, sourcePath, transformOptions) with transformOptions being an
// object that includes { config, configString, instrument }.
//
// Jest 26 (@jest/transform@26) calls the old API with different signatures:
//   getCacheKey(fileData, filePath, configString, { config, instrument, rootDir })
//     — 3rd arg is a raw JSON string of the config
//   process(sourceText, sourcePath, rawConfig, { instrument, supportsDynamicImport, supportsStaticESM })
//     — 3rd arg is the raw ProjectConfig object directly (NOT wrapped in { config: ... })
//
// This wrapper detects each Jest 26 call shape and adapts it to what babel-jest v30
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
 * Normalise getCacheKey / process arguments from the Jest 26 calling convention
 * to the Jest 27+ convention that babel-jest v30 requires.
 *
 * Jest 26 getCacheKey: (fileData, filePath, configString, { config, instrument, rootDir })
 *   — 3rd arg is a raw configString (string), 4th carries { config: ProjectConfig, ... }
 *
 * Jest 26 process:     (sourceText, sourcePath, rawConfig, { instrument, ... })
 *   — 3rd arg is the raw ProjectConfig object directly (NOT wrapped in { config: ... })
 *
 * Jest 27+ both:       (sourceText/fileData, sourcePath/filePath, { config, configString, instrument, ... })
 *   — 3rd arg is a transformOptions object that wraps config
 *
 * babel-jest v30 requires transformOptions.config.cwd to be present.
 */
function normaliseTransformOptions(configStringOrOptions, legacyOptions) {
  if (typeof configStringOrOptions === 'string') {
    // Jest 26 getCacheKey style: third arg is configString, fourth arg has { config, instrument, rootDir }
    const rawConfig = (legacyOptions && legacyOptions.config) || {};
    const config = Object.assign({}, rawConfig, {
      cwd: rawConfig.cwd || rawConfig.rootDir || process.cwd(),
    });
    return Object.assign({}, legacyOptions, {
      config,
      configString: configStringOrOptions,
    });
  }

  const opts = configStringOrOptions || {};

  if (!opts.config) {
    // Jest 26 process style: third arg IS the raw ProjectConfig (has rootDir but no 'config' wrapper),
    // fourth arg is { instrument, supportsDynamicImport, supportsStaticESM }.
    const rawConfig = opts;
    const config = Object.assign({}, rawConfig, {
      cwd: rawConfig.cwd || rawConfig.rootDir || process.cwd(),
    });
    return Object.assign({}, legacyOptions, {
      config,
      configString: '',
    });
  }

  // Jest 27+ style: third arg is already { config: ProjectConfig, configString, instrument, ... }.
  // Ensure config.cwd is populated (Jest 26 ProjectConfig lacks it).
  if (!opts.config.cwd) {
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
