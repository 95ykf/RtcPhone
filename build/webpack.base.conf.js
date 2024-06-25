'use strict';
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); //CSS文件单独提取出来
const htmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
    // 入口文件
    entry: {
        RtcPhone: path.resolve(__dirname, '../src/index.js'),
    },
    // 出口文件
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: 'js/[name].js',
        library: '[name]',
        libraryExport: 'default',
        libraryTarget: 'umd',
        clean: true,
    },
    target: 'web',
    module: {
        rules: [
            {
                test: /\.css$/,
                exclude: /(node_modules|static)/,
                use: ['css-hot-loader', MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader']
            },
            {
                test: /\.less$/,
                exclude: /(node_modules|static)/,
                use: ['css-hot-loader', MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'less-loader']
            },
            {
                test: /\.scss$/,
                exclude: /(node_modules|static)/,
                use: ['css-hot-loader', MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader']
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                      maxSize: 1024 * 15,
                    }
                },
                generator: {
                    publicPath: '../',
                    filename: 'images/[name]_[hash:6].[ext]',
                }
            },
            {
                test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                      maxSize: 1024 * 15,
                    }
                },
                generator: {
                    publicPath: '../',
                    filename: 'media/[name]_[hash:6].[ext]',
                }
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                type: 'asset/resource',
                exclude: /node_modules/,
                parser: {
                    dataUrlCondition: {
                      maxSize: 1024 * 20,
                    }
                },
                generator: {
                    publicPath: '../',
                    filename: 'fonts/[name]_[hash:6].[ext]',
                }
            }
        ]
    },
    plugins: [
        new htmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve(__dirname, '../static/index.html'),
            inject: 'head',
            minify: false,
        }),
        new MiniCssExtractPlugin({
            filename: "css/[name].css",
            chunkFilename: "css/[id].css"
        }),
    ]
};
