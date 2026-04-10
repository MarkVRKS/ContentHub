const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const fs = require('fs');
const os = require('os');
const { spawn, exec } = require('child_process');

let mainWindow;
let serverProcess = null;
const PORT = 3000;

function startApp() {
  const exeDir = path.dirname(app.getPath('exe'));
  const serverExePath = path.join(exeDir, 'PromptAGG_Server.exe'); 
  
  const isManager = fs.existsSync(serverExePath);

  if (isManager) {
    console.log("Найден сервер! Запуск в режиме РУКОВОДИТЕЛЯ...");
    serverProcess = spawn(serverExePath, [], { cwd: exeDir });
  } else {
    console.log("Сервер не найден. Запуск в режиме СММ-СПЕЦИАЛИСТА...");
  }

  const serverApp = express();
  const distPath = path.join(__dirname, 'dist');
  
  serverApp.use(express.static(distPath));
  serverApp.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  serverApp.listen(PORT, '127.0.0.1', () => {
    let localIp = '127.0.0.1';
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIp = iface.address;
        }
      }
    }

    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1024,
      minHeight: 768,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        devTools: false // 👈 Отключили панель разработчика
      }
    });

    // 👈 Прячем стандартное меню Windows
    mainWindow.setMenu(null); 

    mainWindow.loadURL(`http://localhost:${PORT}?isManager=${isManager}&localIp=${localIp}`);
  });
}

app.whenReady().then(() => {
  startApp();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) startApp();
  });
});

app.on('will-quit', () => {
  if (serverProcess) serverProcess.kill();
  exec('taskkill /F /IM PromptAGG_Server.exe', (err) => {
    console.log("Сервер принудительно остановлен.");
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});