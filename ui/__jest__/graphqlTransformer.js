// jest-transform-graphql@2.1.0 predates the Jest 28 transformer contract: its
// process() returns the compiled module as a bare string. Jest 28+ requires
// process() to return an object with a `code` string property, otherwise it
// throws "Invalid return value". Wrap the upstream transformer to adapt the
// return shape without changing what it produces.
const graphqlTransformer = require('jest-transform-graphql');

module.exports = {
  process(...args) {
    const result = graphqlTransformer.process(...args);

    return typeof result === 'string' ? { code: result } : result;
  },
};
