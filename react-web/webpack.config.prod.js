var webpack = require('webpack');

module.exports = {
  entry: "./src/index.tsx",
  output: {
    filename: "./dist/bundle.js"
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },

  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    })
  ],
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