// Wrapper around jest-transform-graphql for Jest 28+ compatibility.
//
// jest-transform-graphql's process() returns a bare string, but Jest 28+
// requires transformers to return { code: string }.  This module wraps the
// upstream transformer so its result is always in the correct format.
const upstream = require('jest-transform-graphql');

module.exports = {
  process(src, filename, options) {
    const result = upstream.process(src, filename, options);
    if (typeof result === 'string') {
      return { code: result };
    }
    return result;
  },
};
