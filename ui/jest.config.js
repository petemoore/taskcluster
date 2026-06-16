process.env.NODE_ENV = process.env.NODE_ENV || "test";

module.exports = {
  rootDir: __dirname,
  moduleDirectories: ["node_modules"],
  moduleFileExtensions: ["web.jsx", "web.js", "wasm", "jsx", "js", "json"],
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/__jest__/fileMock.js",
    "\\.(css|less|sass|scss)$": "<rootDir>/__jest__/styleMock.js",
  },
  bail: true,
  collectCoverageFrom: ["src/**/*.{mjs,jsx,js}"],
  testEnvironment: "jsdom",
  testRegex: null,
  verbose: false,
  transform: {
    "\\.(mjs|jsx|js)$": "<rootDir>/__jest__/transformer.js",
    "^.+\\.(js|jsx)$": "babel-jest",
    "\\.graphql$": "<rootDir>/__jest__/graphqlTransformer.js",
  },
  testMatch: [
    "<rootDir>/src/**/*.test.(js|jsx)",
    "<rootDir>/tests/unit/**/*.test.(ts)",
  ],
  setupFilesAfterEnv: ["./jest.setup.js"],
  transformIgnorePatterns: [
    // dexie's package "exports" map resolves to its ESM build under the jsdom
    // "browser" condition that Jest 28+ enables by default; let Babel transform
    // it so the bare `export` syntax does not break the CommonJS require path.
    "node_modules/(?!is-absolute-url|@taskcluster/client-web|dexie)",
  ],
};
