// babel-jest 30.x peer dependency requirements (both satisfied by this repo):
//   @babel/core ^7.11.0 || ^8.0.0-0  (we have ^7.25.2)
//   Node.js >=18.14.0                 (.nvmrc and package.json engines pin Node 24.16.0)
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
  testEnvironment: "jest-environment-jsdom",
  verbose: false,
  transform: {
    "\\.(mjs|jsx|js)$": "<rootDir>/__jest__/transformer.js",
    "\\.graphql$": "<rootDir>/__jest__/graphql-transformer.js",
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
