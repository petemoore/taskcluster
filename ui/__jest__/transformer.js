const babelJestMd = require('babel-jest');
const babelJest = babelJestMd.__esModule ? babelJestMd.default : babelJestMd;

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

const transformer = babelJest.createTransformer(jestBabelOptions);

// The installed Jest runtime (@jest/transform v26) still calls transformers
// using the v26 calling convention, but babel-jest v30 implements the v30
// transformer interface. The two conventions differ in how the transform
// options are passed:
//
//   getCacheKey
//     v26: (sourceText, sourcePath, configString, { config, instrument, ... })
//     v30: (sourceText, sourcePath, { config, configString, instrument, ... })
//
//   process
//     v26: (sourceText, sourcePath, config, { instrument, ... })
//     v30: (sourceText, sourcePath, { config, instrument, ... })
//
// Without bridging, babel-jest v30 reads `transformOptions.config.cwd` from the
// wrong argument and crashes with
// `TypeError: Cannot read properties of undefined (reading 'cwd')`.
//
// This wrapper detects the calling convention and forwards arguments in the
// shape babel-jest v30 expects, so it keeps working whether invoked by Jest 26
// (current) or a future Jest 30 runtime.
module.exports = {
  ...transformer,

  getCacheKey(sourceText, sourcePath, configStringOrOptions, options) {
    if (typeof configStringOrOptions === 'string') {
      // Jest 26 calling convention.
      return transformer.getCacheKey(sourceText, sourcePath, {
        ...options,
        configString: configStringOrOptions,
      });
    }

    // Already in the Jest 30 calling convention.
    return transformer.getCacheKey(sourceText, sourcePath, configStringOrOptions);
  },

  process(sourceText, sourcePath, configOrOptions, options) {
    if (configOrOptions && configOrOptions.config) {
      // Already in the Jest 30 calling convention.
      return transformer.process(sourceText, sourcePath, configOrOptions);
    }

    // Jest 26 calling convention.
    return transformer.process(sourceText, sourcePath, {
      ...options,
      config: configOrOptions,
    });
  },
};
