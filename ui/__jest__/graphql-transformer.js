// Jest 28+ requires transformers to return { code: string } instead of a string.
// jest-transform-graphql 2.x still returns a plain string, so we wrap it here.
const loader = require('graphql-tag/loader');

module.exports = {
  process(src) {
    const code = loader.call({ cacheable() {} }, src);
    return { code };
  },
};
