// Modules to control application life and create native browser window
const {app, BrowserWindow,ipcMain} = require('electron')
const path = require('path')
const autoUpdater = require("electron-updater").autoUpdater;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow //mainWindow主窗口


function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: './favicon.png',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), //在页面运行其他脚本之前预先加载指定的脚本
      // devTools:true, //是否开启 DevTools
      nodeIntegration:true
    },
    show: false
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')


  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.send('ping', 'whoooooooh!');
    updateHandle() //更新需要在页面显示之后，否则不能打印出相应的内容
  })




}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  console.log('process.platform',process.platform) //平台
  if (process.platform !== 'darwin'){
    app.quit()
  }
})

app.on('activate', function () {
  console.log('activate')
  if (mainWindow === null) createWindow()
})


function updateHandle() {
  let message = {
    error: '检查更新出错',
    checking: '正在检查更新……',
    updateAva: '检测到新版本，正在下载……',
    updateNotAva: '现在使用的就是最新版本，不用更新',
  };

  autoUpdater.setFeedURL('http://localhost:3000/electron/');
  autoUpdater.autoDownload = false //不强制下载
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

    // ipcMain.on('isUpdateNow', (e, arg) => { //监听渲染发送过来的消息，比如用户按确定键后再开始跟新
    //   console.log("开始更新");
    //   sendUpdateMessage('开始更新')
    //   //some code here to handle event
    //   autoUpdater.quitAndInstall();
    // });
    // mainWindow.webContents.send('isUpdateNow') //像渲染层发送消息

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
