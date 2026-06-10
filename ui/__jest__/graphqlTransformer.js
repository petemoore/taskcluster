// jest-transform-graphql returns a plain string from its process() method,
// but Jest 28+ requires transformers to return { code: string }.
// This wrapper adapts the old transformer to the new API.
const loader = require('graphql-tag/loader');

module.exports = {
  process(src) {
    const code = loader.call({ cacheable() {} }, src);
    return { code };
  },
};
