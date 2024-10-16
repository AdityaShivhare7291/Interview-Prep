const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'background/background': './src/background/background.js',
    'content_scripts/content': './src/content_scripts/content.js',
    'content_scripts/linkedin/content_linkedin': './src/content_scripts/linkedin/content_linkedin.js',
    'options/options': './src/options/options.js',
    'popup/popup': './src/popup/popup.js',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(js|jsx)$/,
        use: ['babel-loader'],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/' },
      ],
    }),
  ],
};