// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
console.log('render')
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