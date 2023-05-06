'use strict';
const baseWebpackConfig = require('./webpack.base.conf');
const merge = require('webpack-merge');
const path = require('path');

const CleanWebpackPlugin = require('clean-webpack-plugin'); // 清空打包目录的插件
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = merge(baseWebpackConfig, {
    output:{
        publicPath: '/'
    },
    devtool: 'source-map',
    devServer: {
        contentBase: path.resolve(__dirname, '../static'),
        host : "0.0.0.0", //设置0.0.0.0使得可以通过本机ip访问项目
        port: 8088,
        historyApiFallback: true,
        inline:true
    },
    watchOptions: {
        ignored: /node_modules/, //忽略不用监听变更的目录
        aggregateTimeout: 500, //防止重复保存频繁重新编译,500毫米内重复保存不打包
        poll:1000 //每秒询问的文件变更的次数
    },
    plugins: [
        new CleanWebpackPlugin(['dist'], {
            root: path.resolve(__dirname, '../'),
            verbose: true,
            dry:  false
        }),
        new CopyWebpackPlugin([
          {
            from: path.resolve(__dirname, '../static'),
            // to: config.build.assetsSubDirectory,
          }
        ])
    ]
});
