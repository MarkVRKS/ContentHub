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
  // 1. Определяем директорию, откуда запущен экзешник
  let exeDir;
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    exeDir = process.env.PORTABLE_EXECUTABLE_DIR;
  } else if (app.isPackaged) {
    exeDir = path.dirname(app.getPath('exe'));
  } else {
    exeDir = app.getAppPath();
  }

  // 2. Ищем напрямую питоновский файл в виртуальном окружении, БЕЗ БАТНИКОВ
  const backendAppDir = path.join(exeDir, 'backend', 'app'); 
  const pythonExe = path.join(backendAppDir, 'venv', 'Scripts', 'python.exe');
  
  // Проверяем, существует ли python.exe (значит мы на компе Руководителя)
  const isManager = fs.existsSync(pythonExe);

  if (isManager) {
    console.log("НАЙДЕН БЭКЕНД. Запускаем скрыто через: " + pythonExe);
    
    // 3. Запускаем сервер напрямую через python.exe
    serverProcess = spawn(pythonExe, ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'], { 
      cwd: backendAppDir,
      windowsHide: true, // Прячет консоль от руководителя
      detached: false
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Логи сервера: ${data}`);
    });
  } else {
    console.log("БЭКЕНД НЕ НАЙДЕН. Включаем режим SMM-сотрудника.");
  }

  // 4. Поднимаем локальный Express для интерфейса
  const serverApp = express();
  const distPath = path.join(__dirname, 'dist');
  
  serverApp.use(express.static(distPath));
  serverApp.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  serverApp.listen(PORT, '127.0.0.1', () => {
    // Получаем локальный IP для шаринга команде
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
    // mainWindow.webContents.openDevTools(); // Раскомментируй, если нужен дебаг

    const startUrl = `http://localhost:${PORT}?isManager=${isManager}&localIp=${localIp}`;

    // Ждем 2.5 секунды, чтобы база данных гарантированно поднялась
    if (isManager) {
      setTimeout(() => {
        mainWindow.loadURL(startUrl);
      }, 2500);
    } else {
      mainWindow.loadURL(startUrl);
    }

    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.executeJavaScript(`
        if ('${localIp}' !== '127.0.0.1') {
           localStorage.setItem('MANAGER_DISPLAY_IP', '${localIp}');
        }
        if (${isManager}) {
           localStorage.setItem('HUB_IP', '127.0.0.1');
        }
      `);
    });
  });
}

app.whenReady().then(startApp);

app.on('will-quit', () => {
  // 5. Жестко убиваем процессы питона при закрытии приложения
  if (serverProcess) serverProcess.kill();
  exec('taskkill /F /IM python.exe /T', () => {});
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});