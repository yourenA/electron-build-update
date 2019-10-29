/**
 * Created by Administrator on 2019/9/20.
 */
const { app, BrowserWindow } = require('electron')
let win = null

app.on('ready', () => {
    win = new BrowserWindow({ width: 800, height: 600 })
    win.loadURL('http://182.61.56.51:6003/user/login')
})