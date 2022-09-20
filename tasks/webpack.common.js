const webpack = require('webpack');

module.exports = {
  entry: [
    'core-js/stable',
    './origo.js'
  ],
  resolve: {
    fallback: { "https": false, "zlib": false, "http": false, "url": false }
  },
  plugins: [
    new webpack.ProvidePlugin({
      proj4: 'proj4'
    }),
    new webpack.DefinePlugin({
      CESIUM_BASE_URL: JSON.stringify('dist/thirdparty/cesiumassets')
    })
  ]
};
