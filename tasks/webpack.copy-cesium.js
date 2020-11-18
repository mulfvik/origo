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
      { from: path.join(cesiumSource, cesiumWorkers), to: 'Workers' },
      { from: path.join(cesiumSource, 'Widgets'), to: 'Widgets' },
      { from: path.join(cesiumSource, 'Assets'), to: 'Assets' },
      { from: path.join(cesiumSource, cesiumWorkers), to: 'dist/Workers' },
      { from: path.join(cesiumSource, 'Widgets'), to: 'dist/Widgets' },
      { from: path.join(cesiumSource, 'Assets'), to: 'dist/Assets' }
    ])
  ]
});
