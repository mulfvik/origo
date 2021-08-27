const webpack = require('webpack');

module.exports = {
  entry: [
    'babel-polyfill',
    'core-js/stable',
    'whatwg-fetch',
    './origo.js'
  ],
  module: {
    unknownContextCritical: false,
    rules: [
      {
        test: /\.m?js$/,
        enforce: 'pre',
        use: ['source-map-loader']
      },
      {
        test: /\.(js)$/,
        exclude: {
          test: /node_modules/,
          not: [
            /@mapbox/,
            /@glidejs/
          ]
        },
        use: {
          loader: 'babel-loader'
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
    // new webpack.ProvidePlugin({
    //   fetch: 'exports-loader?self.fetch!whatwg-fetch/dist/fetch.umd'
    // }),
    new webpack.DefinePlugin({
      CESIUM_BASE_URL: JSON.stringify('dist/thirdparty/cesiumassets')
    })
  ]
};
