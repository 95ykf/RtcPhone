'use strict';
const baseWebpackConfig = require('./webpack.base.conf');
const { merge } = require('webpack-merge');
const path = require('path');

const CssMinimizerWebpackPlugin = require("css-minimizer-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin')

const webpackConfig = merge(baseWebpackConfig, {
    output:{
        publicPath: './', //这里要放的是静态资源CDN的地址(一般只在生产环境下配置)
        filename: 'js/[name].min.js',
    },
    optimization: {
        minimize: true,
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, '../static'),
                    globOptions: {
                        gitignore: true,
                        ignore: ['**/index.html'],
                    },
                },
            ],
        })
    ]
});

// 是否生产构建报表
if (process.env.npm_config_report) {
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
    webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = webpackConfig;
