const webpack = require('webpack');

module.exports = {
  entry: [
    './origo.js'
  ],
  module: {
    unknownContextCritical: false,
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          cacheDirectory: false,
          presets: [
            ['@babel/preset-env', {
              targets: {
                browsers: ['chrome >= 39']
              },
              modules: false,
              useBuiltIns: 'entry',
              corejs: 3
            }]
          ],
          plugins: [
            ['@babel/plugin-transform-runtime', {
              regenerator: true
            }]
          ]
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|gif|jpg|jpeg|svg|xml|json)$/,
        use: ['url-loader']
      }
    ]
  },
  amd: {
    toUrlUndefined: true
  },
  node: {
    fs: 'empty'
  },
  resolve: {
    extensions: ['*', '.js']
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      proj4: 'proj4'
    }),
    new webpack.ProvidePlugin({
      fetch: 'exports-loader?self.fetch!whatwg-fetch/dist/fetch.umd'
    }),
    new webpack.DefinePlugin({
      CESIUM_BASE_URL: JSON.stringify('')
    })
  ]
};
