const { merge } = require('webpack-merge');
const common = require('./webpack.common');

module.exports = merge(common, {
  output: {
    publicPath: '/js',
    filename: 'origo.js',
    libraryTarget: 'var',
    libraryExport: 'default',
    library: 'Origo',
    sourcePrefix: ''
  },
  devServer: {
    contentBase: './',
    port: 9966,
    disableHostCheck: true
  }
});
