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
  verbose: false,
  transform: {
    "\\.(mjs|jsx|js)$": "<rootDir>/__jest__/transformer.js",
    "^.+\\.(js|jsx)$": "babel-jest",
    // jest-transform-graphql returns a plain string; our wrapper adapts it to
    // the Jest 28+ transformer API which requires { code: string }
    "\\.graphql$": "<rootDir>/__jest__/graphqlTransformer.js",
  },
  testMatch: [
    "<rootDir>/src/**/*.test.(js|jsx)",
    "<rootDir>/tests/unit/**/*.test.(ts)",
  ],
  setupFilesAfterEnv: ["./jest.setup.js"],
  transformIgnorePatterns: [
    // is-absolute-url and @taskcluster/client-web use ESM and must be transformed.
    // dexie ships only an ESM build (dexie.mjs) in modern environments; it must
    // be transformed so Jest (CommonJS) can consume it.
    "node_modules/(?!is-absolute-url|@taskcluster/client-web|dexie)",
  ],
};
