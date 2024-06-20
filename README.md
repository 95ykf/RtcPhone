## 九五云客服WebRTC话机SDK
WebRTC话机SDK是一个在浏览器内使用的内置话机，可以在移动端和PC web中快速实现通话能力。

## 使用方法

### 引用文件
需要引用的js和css可以通过releases下载，也可以通过npm run build:prod命令重新打包获得。
```html
<!--引入js-->
<script src='sipml-api.js'></script>
<script src='RtcPhone.min.js'></script>
```
### 创建组件
1. 创建组件时需要铃音DOM位置、本地video DOM、远程video DOM、audio语音组件DOM自定义事件回调等。如下示例：
```javascript
rtcPhone = new RtcPhone({
    ringToneDom: 'ringtone',
    ringbackToneDom: 'ringbacktone',

    audioRemoteDom: 'audio_remote',
    videoLocalDom: 'video_local',
    videoRemoteDom: 'video_remote',

    onInitialized: onInitialized,
    onConnected: onConnected,
    onDisconnected: onDisconnected,
    onRinging: onRinging,
    onDialing: onDialing,
    onTalking: onTalking,
    onReleased: onReleased,
})
```
2. 话机初始化
```javascript
rtcPhone.sipInit();
```
3. 注册分机需要再初始化完成以后执行，分机注册需要分机的显示名称、分机号、密码等账号信息

注意：`建议与初始化回调执行完成后注册，以免出现注册失败导致话机初始化失败的问题`
```javascript
rtcPhone.sipRegister({
    displayName: document.getElementById('displayName').value,
    privateIdentity: document.getElementById('privateIdentity').value,
    publicIdentity: document.getElementById('publicIdentity').value,
    password: document.getElementById('password').value,
    realm: document.getElementById('realm').value,
    websocketProxyUrl: document.getElementById('websocketProxyUrl').value,
});
```
### 常见问题
1. TypeError: getPlugin(...).createPeerConnection is not a function

因为获取麦克风和摄像头权限必须https方式访问才被允许，需要将访问方式改为https。
1. DOMException: Permission denied

是否用户禁用了摄像头权限；
如果嵌入iframe需要再iframe属性中增加`allow="microphone;camera;"`

## 开发
node编译环境使用16版本，如使用16以上版本需要设置全局变量


Linux & Mac OS (windows git bash)
```
export NODE_OPTIONS=--openssl-legacy-provider
```
windows命令提示符:
```
set NODE_OPTIONS=--openssl-legacy-provider
```

### 安装
```shell
npm install
```
### 启动调试
```shell
npm start
```
### 构建打包
构建用于生产环境
```shell
npm run build:prod
```
构建用于开发环境
```shell
npm run build:dev
```

### 低版本浏览器兼容插件
https://github.com/webrtcHacks/adapter