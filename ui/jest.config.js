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
  // V8 coverage uses Node's built-in instrumentation instead of babel
  // transforms, which is significantly faster with jest 30.
  coverageProvider: "v8",
  // Ensure jest exits even when open handles (timers, network, etc.) remain
  // after all tests complete, preventing the CI task from timing out.
  forceExit: true,
  testEnvironment: "jsdom",
  verbose: false,
  transform: {
    "\\.(mjs|jsx|js)$": "<rootDir>/__jest__/transformer.js",
    "\\.graphql$": "<rootDir>/__jest__/graphqlTransformer.js",
  },
  testMatch: [
    "<rootDir>/src/**/*.test.(js|jsx)",
    "<rootDir>/tests/unit/**/*.test.(ts)",
  ],
  setupFilesAfterEnv: ["./jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!is-absolute-url|@taskcluster/client-web|dexie)",
  ],
};
