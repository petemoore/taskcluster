// Wrapper around jest-transform-graphql to be compatible with jest 28+.
// jest 28+ requires process() to return {code: string} instead of a plain string.
const jestTransformGraphql = require('jest-transform-graphql');

module.exports = {
  process(src, filename, options) {
    const result = jestTransformGraphql.process(src, filename, options);
    if (typeof result === 'string') {
      return { code: result };
    }
    return result;
  },
};
