const path = require('path');
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const common = require('./webpack.common.js');

const cesiumSource = 'node_modules/cesium/Source';
const cesiumWorkers = '../Build/Cesium/Workers';

module.exports = merge(common, {
  context: `${__dirname}/../`,
  output: {
    path: `${__dirname}/../`,
    filename: 'build/js/origo.js',
    libraryTarget: 'var',
    libraryExport: 'default',
    library: 'Origo',
    sourcePrefix: ''
  },

  mode: 'production',
  plugins: [
    new CopyWebpackPlugin([
      { from: path.join(cesiumSource, cesiumWorkers), to: 'dist/thirdparty/cesiumassets/Workers' },
      { from: path.join(cesiumSource, 'Widgets'), to: 'dist/thirdparty/cesiumassets/Widgets' },
      { from: path.join(cesiumSource, 'Assets'), to: 'dist/thirdparty/cesiumassets/Assets' },
      { from: path.join(cesiumSource, 'ThirdParty'), to: 'dist/thirdparty/cesiumassets/ThirdParty' }
    ])
  ]
});
