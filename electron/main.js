const {app,BrowserWindow}=require('electron');const path=require('path');const {spawn}=require('child_process');
let server;
function create(){let w=new BrowserWindow({width:1200,height:800,minWidth:850,minHeight:600,backgroundColor:'#080a0f',webPreferences:{contextIsolation:true}});w.loadURL('http://localhost:3000');}
app.whenReady().then(()=>{server=spawn(process.execPath,[path.join(__dirname,'../server/server.js')],{env:{...process.env},stdio:'ignore'});setTimeout(create,1200)});
app.on('window-all-closed',()=>{if(server)server.kill();if(process.platform!=='darwin')app.quit()});
