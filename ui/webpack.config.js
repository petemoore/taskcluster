const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
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
    // webpack 5's schema no longer accepts a function here; ignore the large
    // node_modules tree to keep watch mode responsive.
    ignored: /node_modules/,
  },
  externals: { bindings: "bindings" },
  output: {
    path: `${__dirname}/build`,
    publicPath: "/",
    filename: "assets/[name].[contenthash:8].js",
    clean: true,
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
    // webpack 5 no longer polyfills Node.js core modules automatically (it
    // used to pull them in via node-libs-browser). `@mdx-js/runtime` bundles a
    // full Babel build that references these core modules, so we restore the
    // same browserify polyfills webpack 4 provided. `fs`/`tls`/`net` keep the
    // previous `node: { fs: "empty", tls: "empty" }` behaviour (now `false`),
    // and `Buffer` is provided via ProvidePlugin plus the `buffer` fallback.
    fallback: {
      fs: false,
      tls: false,
      net: false,
      buffer: require.resolve("buffer/"),
      assert: require.resolve("assert/"),
      crypto: require.resolve("crypto-browserify"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      os: require.resolve("os-browserify/browser"),
      path: require.resolve("path-browserify"),
      querystring: require.resolve("querystring-es3"),
      stream: require.resolve("stream-browserify"),
      url: require.resolve("url/"),
      vm: require.resolve("vm-browserify"),
      zlib: require.resolve("browserify-zlib"),
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
    // webpack-dev-server v5 requires the proxy option to be an array of
    // route definitions (the object form from v3 is no longer supported).
    proxy: [
      {
        context: ["/login", "/graphql", "/schemas", "/references", "/api/web-server"],
        target: proxyTarget,
        changeOrigin: true,
      },
      {
        context: ["/subscription"],
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
    ],
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader",
            options: {
              // html-loader v5 replaced the `attrs` option with `sources`.
              // The default already processes `img:src` and `link:href`, so
              // restrict it to those attributes to preserve prior behaviour.
              sources: {
                list: [
                  { tag: "img", attribute: "src", type: "src" },
                  { tag: "link", attribute: "href", type: "src" },
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.(js|jsx)$/,
        include: [`${__dirname}/src`, `${__dirname}/test`],
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
              name: "assets/[name].[contenthash:8].[ext]",
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
              name: "assets/[name].[contenthash:8].[ext]",
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
        // webpack 5 parses JSON natively via the built-in `json` module type,
        // so the deprecated json-loader is no longer required.
        test: /\.all-contributorsrc$/,
        type: "json",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      templateContent: false,
      filename: "docs.html",
      publicPath: "auto",
      hash: false,
      inject: "body",
      scriptLoading: "blocking",
      compile: true,
      favicon: false,
      minify: "auto",
      cache: true,
      showErrors: true,
      chunks: ["docs"],
      excludeChunks: [],
      chunksSortMode: "auto",
      meta: { viewport: "width=device-width, initial-scale=1" },
      base: false,
      title: "Webpack App",
      xhtml: false,
      appMountId: "root",
      lang: "en",
    }),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      templateContent: false,
      filename: "index.html",
      publicPath: "auto",
      hash: false,
      inject: "body",
      scriptLoading: "blocking",
      compile: true,
      favicon: false,
      minify: "auto",
      cache: true,
      showErrors: true,
      chunks: ["index"],
      excludeChunks: [],
      chunksSortMode: "auto",
      meta: { viewport: "width=device-width, initial-scale=1" },
      base: false,
      title: "Webpack App",
      xhtml: false,
      appMountId: "root",
      lang: "en",
    }),
    new MiniCssExtractPlugin({
      filename: "assets/[name].[contenthash:8].css",
      ignoreOrder: false,
      chunkFilename: "assets/[name].[contenthash:8].css",
    }),
    // clean-webpack-plugin is replaced by the built-in `output.clean: true`.
    // copy-webpack-plugin v12 takes a `{ patterns: [...] }` object instead of
    // a bare array.
    new CopyPlugin({
      patterns: [
        {
          context: "src/static",
          from: "**/*",
          to: "static",
          // src/static is generated at runtime (env.js) and may be absent at
          // build time; copy-webpack-plugin v12 errors on a missing source
          // unless told otherwise.
          noErrorOnMissing: true,
        },
      ],
    }),
    // webpack 5 no longer provides a global Buffer shim automatically; restore
    // it to match the previous `node: { Buffer: true }` behaviour.
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
  ],
  entry: {
    index: [`${__dirname}/src/index.jsx`],
    docs: [`${__dirname}/src/docs.jsx`],
  },
});
