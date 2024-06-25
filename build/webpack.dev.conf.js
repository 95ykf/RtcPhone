'use strict';
const baseWebpackConfig = require('./webpack.base.conf');
const {merge} = require('webpack-merge');
const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = merge(baseWebpackConfig, {
    output:{
        publicPath: '/'
    },
    devtool: 'source-map',
    devServer: {
        hot: true, // 模块热加载
        server: 'https',
        host: '0.0.0.0',
        port: 8088,
        client: {
            overlay: false, // 编译错误时，取消全屏覆盖（建议关掉）
        },
        static: {
            directory: path.join(__dirname, '../dist'),
        },
    },
    watchOptions: {
        ignored: /node_modules/, //忽略不用监听变更的目录
        aggregateTimeout: 500, //防止重复保存频繁重新编译,500毫米内重复保存不打包
        poll:1000 //每秒询问的文件变更的次数
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
        }),
    ]
});
