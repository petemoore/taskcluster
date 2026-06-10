const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const generateEnvJs = require("./generate-env-js");
const DEFAULT_PORT = 5080;
const port = process.env.PORT || DEFAULT_PORT;
const { join, resolve } = require("path");
const STATIC_DIR = join(__dirname, "src/static");
const proxyTarget = process.env.TASKCLUSTER_ROOT_URL || "http://localhost:3050";
const fs = require("fs");

// Generate env.js, combining env vars into the build, when
// GENERATE_ENV_JS is set
const envJs = join(STATIC_DIR, "env.js");
if (process.env.GENERATE_ENV_JS) {
  generateEnvJs(envJs);
} else {
  // just so that we never end up accidentally including something
  // in a production build
  if (fs.existsSync(envJs)) {
    fs.unlinkSync(envJs);
  }
}

module.exports = (_, { mode }) => ({
  devtool: mode === "production" ? false : "eval-cheap-module-source-map",
  target: "web",
  context: __dirname,
  watchOptions: {
    ignored: /node_modules/,
  },
  externals: { bindings: "bindings" },
  output: {
    path: `${__dirname}/build`,
    publicPath: "/",
    filename: "assets/[name].[contenthash:8].js",
  },
  stats: {
    children: false,
    entrypoints: false,
    modules: false,
  },
  resolve: {
    alias: {
      "@taskcluster/ui": `${__dirname}/src`,
    },
    extensions: [
      ".web.jsx",
      ".web.js",
      ".wasm",
      ".mjs",
      ".jsx",
      ".js",
      ".json",
    ],
    fallback: {
      fs: false,
      tls: false,
      net: false,
      dns: false,
      vm: false,
      assert: require.resolve("assert/"),
      buffer: require.resolve("buffer/"),
      crypto: require.resolve("crypto-browserify"),
      path: require.resolve("path-browserify"),
      process: require.resolve("process/browser"),
      stream: require.resolve("stream-browserify"),
      url: require.resolve("url/"),
    },
  },
  optimization: {
    minimize: true,
    splitChunks: { chunks: "all", maxInitialRequests: 5, name: false },
    runtimeChunk: "single",
  },
  devServer: {
    port,
    historyApiFallback: {
      disableDotRule: true,
      rewrites: [{ from: /^\/docs/, to: "/docs.html" }],
    },
    proxy: {
      "/login": {
        target: proxyTarget,
        changeOrigin: true,
      },
      "/graphql": {
        target: proxyTarget,
        changeOrigin: true,
      },
      "/schemas": {
        target: proxyTarget,
        changeOrigin: true,
      },
      "/references": {
        target: proxyTarget,
        changeOrigin: true,
      },
      "/subscription": {
        ws: true,
        changeOrigin: true,
        target: proxyTarget.replace(/^http(s)?:/, "ws$1:"),
        onError: function(err, req, res) {
          console.warn("[WS Proxy Error]", err.code, err.message);
        },
        onProxyReqWs: function(proxyReq, req, socket) {
          socket.on("error", function(err) {
            console.warn("[WS Socket Error]", err.code, err.message);
          });
        },
      },
      "/api/web-server": {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        include: [
          `${__dirname}/src`,
          `${__dirname}/test`,
          resolve(__dirname, "node_modules/@sentry"),
          resolve(__dirname, "node_modules/@sentry-internal"),
          resolve(__dirname, "node_modules/react-diff-viewer-continued"),
        ],
        use: [
          {
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
              babelrc: false,
              configFile: false,
              presets: [
                [
                  "@babel/preset-env",
                  {
                    debug: false,
                    useBuiltIns: false,
                    shippedProposals: true,
                    targets: {
                      browsers: [
                        "last 2 Chrome versions",
                        "last 2 Firefox versions",
                        "last 2 Edge versions",
                        "last 2 Opera versions",
                        "last 2 Safari versions",
                        "last 2 iOS versions",
                      ],
                    },
                  },
                ],
                [
                  "@babel/preset-react",
                  {
                    development: mode === "development",
                    useSpread: true,
                  },
                ],
              ],
              plugins: [
                "@babel/plugin-syntax-dynamic-import",
                [
                  "transform-react-remove-prop-types",
                  {
                    removeImport: true,
                  },
                ],
                [
                  "@babel/plugin-proposal-decorators",
                  {
                    legacy: true,
                  },
                ],
                [
                  "@babel/plugin-proposal-class-properties",
                  {
                    loose: false,
                  },
                ],
                [
                  "@babel/plugin-proposal-optional-chaining",
                  {
                    loose: true,
                  },
                ],
                [
                  "@babel/plugin-proposal-nullish-coalescing-operator",
                  {
                    loose: true,
                  },
                ],
                [
                  "@babel/plugin-transform-modules-commonjs",
                  {
                    loose: true,
                  },
                ],
              ],
            },
          },
        ],
      },
      {
        oneOf: [
          {
            test: /\.module\.css$/,
            use: [
              {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  esModule: true,
                },
              },
              {
                loader: "css-loader",
                options: {
                  importLoaders: 0,
                  modules: true,
                },
              },
            ],
          },
          {
            test: /\.css$/,
            use: [
              {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  esModule: true,
                },
              },
              {
                loader: "css-loader",
                options: {
                  importLoaders: 0,
                },
              },
            ],
          },
        ],
      },
      {
        test: /\.(eot|ttf|woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "assets/[name].[hash:8].[ext]",
            },
          },
        ],
      },
      {
        test: /\.(ico|png|jpg|jpeg|gif|svg|webp)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 8192,
              name: "assets/[name].[hash:8].[ext]",
              fallback: require.resolve("file-loader"),
            },
          },
        ],
      },
      {
        test: /\.mjs?$/,
        type: "javascript/auto",
        include: [/node_modules/],
      },
      {
        test: /\.graphql$/,
        loader: "graphql-tag/loader",
        exclude: /node_modules/,
      },
      {
        test: /JSONStream/,
        loader: "shebang-loader",
      },
      {
        test: /CHANGELOG\.md?$/,
        loader: "raw-loader",
      },
      {
        test: /^(?!CHANGELOG\.md$).*\.mdx$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-react"],
            },
          },
          { loader: "mdx-loader" },
        ],
      },
      {
        test: /\.all-contributorsrc$/,
        type: "json",
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "buffer"],
      // Use require.resolve so that the absolute path is embedded in the config
      // and webpack can find it regardless of the requesting module's location
      // (e.g., modules in the root workspace's node_modules).
      process: require.resolve("process/browser"),
    }),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "docs.html",
      publicPath: "auto",
      hash: false,
      inject: "body",
      scriptLoading: "blocking",
      favicon: false,
      minify: "auto",
      cache: true,
      showErrors: true,
      chunks: ["docs"],
      excludeChunks: [],
      meta: { viewport: "width=device-width, initial-scale=1" },
      base: false,
      title: "Webpack App",
      xhtml: false,
    }),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "index.html",
      publicPath: "auto",
      hash: false,
      inject: "body",
      scriptLoading: "blocking",
      favicon: false,
      minify: "auto",
      cache: true,
      showErrors: true,
      chunks: ["index"],
      excludeChunks: [],
      meta: { viewport: "width=device-width, initial-scale=1" },
      base: false,
      title: "Webpack App",
      xhtml: false,
    }),
    new MiniCssExtractPlugin({
      filename: "assets/[name].[contenthash:8].css",
      ignoreOrder: false,
      chunkFilename: "assets/[name].[contenthash:8].css",
    }),
    new CleanWebpackPlugin({
      dangerouslyAllowCleanPatternsOutsideProject: false,
      dry: false,
      verbose: false,
      cleanStaleWebpackAssets: true,
      protectWebpackAssets: true,
      cleanAfterEveryBuildPatterns: [],
      cleanOnceBeforeBuildPatterns: ["**/*"],
      currentAssets: [],
      initialClean: false,
      outputPath: "",
    }),
    new CopyPlugin({ patterns: [{ context: "src/static", from: "**/*", to: "static", noErrorOnMissing: true }] }),
  ],
  entry: {
    index: [`${__dirname}/src/index.jsx`],
    docs: [`${__dirname}/src/docs.jsx`],
  },
});
