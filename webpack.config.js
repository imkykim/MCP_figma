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
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-env", {
                targets: {
                  browsers: ["last 2 versions", "safari >= 7"]
                }
              }]
            ],
            plugins: [
              "@babel/plugin-proposal-optional-chaining"
            ]
          }
        },
      },
    ],
  },
  resolve: {
    extensions: [".js", ".ts"],
  },
};
