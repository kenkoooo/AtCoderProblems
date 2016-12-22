module.exports = {
  entry: "./src/index.tsx",
  output: {
    filename: "./dist/bundle.js"
  },

  devtool: "source-map",

  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {loader: "ts-loader"}
        ]
      }
    ]
  }
};