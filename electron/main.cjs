const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const storageFilePath = () => path.join(app.getPath('userData'), 'smoothflow-storage.json');

const readStorage = () => {
  const filePath = storageFilePath();
  if (!fs.existsSync(filePath)) return {};

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
};

const writeStorage = (next) => {
  const filePath = storageFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(next, null, 2));
};

ipcMain.handle('storage:get', (_event, key) => {
  const db = readStorage();
  return db[key] ?? null;
});

ipcMain.handle('storage:set', (_event, key, value) => {
  const db = readStorage();
  db[key] = value;
  writeStorage(db);
  return true;
});

ipcMain.handle('storage:remove', (_event, key) => {
  const db = readStorage();
  delete db[key];
  writeStorage(db);
  return true;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
