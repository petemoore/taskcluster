// Wrapper around jest-transform-graphql to make it compatible with the
// Jest 30 transformer API.
//
// jest-transform-graphql@2.1.0 returns the transformed source as a plain
// string from its `process()` method. Jest 27+ requires transformers to
// return an object of the shape `{ code: string }` (returning a bare string
// is rejected with an "Invalid return value" error). This thin wrapper
// delegates to the original transformer and normalises its output.
const graphQLTransformer = require('jest-transform-graphql');

module.exports = {
  process(sourceText, sourcePath, options) {
    const result = graphQLTransformer.process(sourceText, sourcePath, options);

    if (typeof result === 'string') {
      return { code: result };
    }

    return result;
  },
};
