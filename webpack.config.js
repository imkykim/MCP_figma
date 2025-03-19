/**
 * Figma 플러그인 빌드를 위한 Webpack 설정
 */

const path = require("path");

module.exports = {
  entry: {
    code: "./figma-plugin/code.js",
    ui: "./figma-plugin/ui.js",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "figma-plugin/dist"),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".js", ".ts"],
  },
};
