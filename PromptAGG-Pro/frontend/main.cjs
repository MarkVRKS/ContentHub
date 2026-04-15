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
  let exeDir;
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    exeDir = process.env.PORTABLE_EXECUTABLE_DIR;
  } else if (app.isPackaged) {
    exeDir = path.dirname(app.getPath('exe'));
  } else {
    exeDir = app.getAppPath();
  }

  const batPath = path.join(exeDir, 'backend', 'app', 'start_server.bat'); 
  const isManager = fs.existsSync(batPath);

  if (isManager) {
    console.log("НАЙДЕН БЭКЕНД В: " + batPath);
    serverProcess = spawn('cmd.exe', ['/c', batPath], { 
      cwd: path.join(exeDir, 'backend', 'app'),
      windowsHide: true,
      detached: false
    });
  } else {
    console.log("БЭКЕНД НЕ НАЙДЕН. Искал тут: " + batPath);
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
      width: 1440,
      height: 900,
      minWidth: 1024,
      minHeight: 768,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    mainWindow.setMenu(null); 
    mainWindow.webContents.openDevTools();

    const startUrl = `http://localhost:${PORT}?isManager=${isManager}`;

    // МАГИЯ СИНХРОНИЗАЦИИ: Ждем 2 секунды, чтобы Питон успел запуститься
    if (isManager) {
      setTimeout(() => {
        mainWindow.loadURL(startUrl);
      }, 2000);
    } else {
      mainWindow.loadURL(startUrl);
    }

    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.executeJavaScript(`
        localStorage.setItem('MANAGER_DISPLAY_IP', '${localIp}');
        if (${isManager}) {
            localStorage.setItem('HUB_IP', '127.0.0.1');
        }
      `);
    });
  });
}

app.whenReady().then(startApp);

app.on('will-quit', () => {
  if (serverProcess) serverProcess.kill();
  exec('taskkill /F /IM python.exe /T', () => {});
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});