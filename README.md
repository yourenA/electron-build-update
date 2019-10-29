使用```electron-builder```打包，使用```electron-updater```自动更新。

#### 1. 安装 electron-builder与electron-updater 包模块
```
$ npm install electron-builder --save-dev
$ npm install electron-updater --save
```
> electron-builder 需要使用```--save-dev```安装，electron-updater 需要使用```--save```安装

#### 2. 配置package.json文件
2.1 package.json文件添加```build```字段
```
  "build":{
    "publish": [
      {
        "provider": "generic",
        "url": "http://localhost:3000/electron/" //存放软件版本的地址,有更新请求都会在这个目录下载文件
      }
    ],
    "directories": { 
      "output": "release",//打包后文件所在位置
      "app": "./"  //开始位置
    },
    "win": { //windows下安装软件配置参数
      "target": [
        "nsis", //打包为nsis安装文件
        "zip"   //打包为安装文件zip
      ]
    },
    "nsis": { //nsis配置参数
      "oneClick": false,  //可单击打开
      "allowToChangeInstallationDirectory": true,   //允许用户选择安装位置
      "perMachine": true
    }
  },
```
> 配置了publish才会生成latest.yml文件，用于自动更新的配置信息；
latest.yml文件是打包过程生成的文件，为避免自动更新出错，
打包后禁止对latest.yml文件做任何修改。
如果文件有误，必须重新打包获取新的latest.yml文件！！！

2.2 ```script```添加参数``` "dist": "electron-builder"```
> 每次更新都必须改变```version```版本号

#### 3. 在主进程文件添加更新规则
```
import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from "electron-updater"

function updateHandle() {
  let message = {
    error: '检查更新出错',
    checking: '正在检查更新……',
    updateAva: '检测到新版本，正在下载……',
    updateNotAva: '现在使用的就是最新版本，不用更新',
  };

  autoUpdater.setFeedURL('http://localhost:3000/electron/'); //package.json->build->publish 更新服务器地址
  autoUpdater.autoDownload = false //不强制下载，如果需要强制更新，可以删除
  autoUpdater.on('error', function (error) {
    sendUpdateMessage(message.error)
  });
  autoUpdater.on('checking-for-update', function () {
    sendUpdateMessage(message.checking)
  });
  autoUpdater.on('update-available', function (info) {
    sendUpdateMessage(message.updateAva) //
    autoUpdater.downloadUpdate().then(res => { //下载更新
      sendUpdateMessage('下载更新')
    });
  });
  autoUpdater.on('update-not-available', function (info) {
    sendUpdateMessage(message.updateNotAva)
  });

  // 更新下载进度事件
  autoUpdater.on('download-progress', function (progressObj) {
    sendUpdateMessage(progressObj.percent) //progressObj里面包含有下载的进度
  })

  autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
    sendUpdateMessage('下载完成，开始更新')
    autoUpdater.quitAndInstall();
  });

  ipcMain.on('UpdateNow', (e, arg) => { //ipcMain主进程监听渲染发送过来的消息，比如用户按确定键后再开始更新
    console.log('用户点击查询更新')
    //如果不是手动更新，将checkForUpdates提取到外面直接执行。
    autoUpdater.checkForUpdates(); //向服务端查询现在是否有可用的更新。在调用这个方法之前，必须要先调用 setFeedURL。
  });

}

function sendUpdateMessage(text) {
  mainWindow.webContents.send('ping', text)
}

//在创建窗口内执行updateHandle
mainWindow.once('ready-to-show', () => {
  mainWindow.show();
  mainWindow.webContents.send('ping', 'whoooooooh!');
  updateHandle() //更新需要在页面显示之后，否则不能打印出相应的内容
})
```

渲染进程
```
require('electron').ipcRenderer.on('ping', function(event, message) {

    console.log(message);  // Prints "whoooooooh!"
    var updateContent=document.querySelector('#update-info')
    var node=document.createElement("p");
    var textnode=document.createTextNode(message);
    node.appendChild(textnode);
    updateContent.appendChild(node);
    //ipcRenderer.send(channel[, arg1][, arg2][, ...]) //向主进程发送消息
});
var version=document.querySelector('#version')
version.innerText=require('./package.json').version

var btn=document.querySelector('#update')
btn.onclick=function () {
    console.log('click update')
    require('electron').ipcRenderer.send('UpdateNow')//ipcRenderer渲染层
}
```
#### 4. 打包文件
在命令行中执行```$ npm run dist```然后在release文件中看到打包出来的相关文件

![image](http://106.13.7.195:3000/images/markdown/image-1572319217685-微信图片_20191029111928.png)
执行exe文件安装应用。

![image](http://106.13.7.195:3000/images/markdown/image-1572319236030-微信图片_20191029111939.png)

#### 5. 软件升级版本
修改package.json中的version属性，例如：改为 version: “2.0.14” (之前为2.0.13)；

#### 6. 将新版本文件移动到更新服务器上
再次执行electron-builder打包，Windows下将新版本latest.yml文件、exe文件、exe.blockmap文件，放到package.json中build -> publish中的url对应的地址下。
> latest.yml文件采取覆盖方式

#### 7. 在应用中触发更新检查，electron-updater自动会通过对应url下的yml文件检查更新；
![image](http://106.13.7.195:3000/images/markdown/image-1572319264703-微信图片_20191029111945.png)
![image](http://106.13.7.195:3000/images/markdown/image-1572319300381-微信图片_20191029111949.png)

#### 本DEMO地址：[https://github.com/yourenA/electron-build-update](https://github.com/yourenA/electron-build-update)
