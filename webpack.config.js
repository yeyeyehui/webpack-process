const { resolve } = require("path");

// 自定义插件
const RunPlugin = require("./plugins/RunPlugin");
const Run1Plugin = require("./plugins/Run1Plugin");
const Run2Plugin = require("./plugins/Run2Plugin");
const DonePlugin = require("./plugins/DonePlugin");

module.exports = {
  mode: "development",
  devtool: false,

  entry: {
    entry1: "./src/entry1.js",
    entry2: "./src/entry2.js",
  },

  output: {
    path: resolve("./dist"),
    filename: "[name].js",
  },

  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          resolve(__dirname, "loaders/logger1-loader.js"),
          resolve(__dirname, "loaders/logger2-loader.js"),
        ],
      },
    ],
  },
  
  plugins: [
    new RunPlugin(),
    new Run2Plugin(),
    new Run1Plugin(),
    new DonePlugin(),
  ],
};
