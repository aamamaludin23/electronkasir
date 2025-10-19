const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'electron/preload.cjs'),
      contextIsolation: true,
    },
  });

  // Load index.html dari path absolut, bukan relatif
  win.loadURL(`file://${path.join(__dirname, 'dist', 'index.html')}`);
}

app.whenReady().then(createWindow);