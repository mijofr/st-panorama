/**
 * Webpack main configuration file
 */

const path = require('path');
const fs = require('fs');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { extendDefaultPlugins } = require('svgo');
const HtmlWebpackInlineSVGPlugin = require('html-webpack-inline-svg-plugin');
const environment = require('./configuration/environment');

const templateFiles = fs.readdirSync(environment.paths.source)
  .filter((file) => path.extname(file).toLowerCase() === '.html');

const htmlPluginEntries = templateFiles.map((template) => new HTMLWebpackPlugin({
  inject: true,
  hash: false,
  filename: template,
  template: path.resolve(environment.paths.source, template),
  favicon: path.resolve(environment.paths.source, 'images', 'favicon.ico'),
}));

module.exports = {
  entry: {
    app: path.resolve(environment.paths.source, 'js', 'app.js'),
  },
  output: {
    filename: 'js/[name].js',
    path: environment.paths.output,
  },
  module: {
    rules: [
      {
        test: /\.((c|sa|sc)ss)$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.(png|gif|jpe?g|svg)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              name: 'images/design/[name].[hash:6].[ext]',
              publicPath: '../',
              limit: environment.limits.images,
            },
          },
        ],
      },
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              name: 'fonts/[name].[hash:6].[ext]',
              publicPath: '../',
              limit: environment.limits.fonts,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),
    new CleanWebpackPlugin({
      verbose: true,
      cleanOnceBeforeBuildPatterns: ['**/*', '!stats.json'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(environment.paths.source, 'images'),
          to: path.resolve(environment.paths.output, 'images'),
          toType: 'dir',
          globOptions: {
            ignore: ['*.DS_Store', 'Thumbs.db'],
          },
        },
        {
          from: path.resolve(environment.paths.source, 'panorama-assets'),
          to: path.resolve(environment.paths.output, 'panorama-assets'),
          toType: 'dir',
          globOptions: {
            ignore: ['*.DS_Store', 'Thumbs.db'],
          },
        },        
      ],
    }),
	new HtmlWebpackInlineSVGPlugin(),
  ].concat(htmlPluginEntries),
  target: 'web',
};
