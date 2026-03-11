const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('smoothflowDesktop', {
  isDesktop: true,
  platform: process.platform,
  storage: {
    get: (key) => ipcRenderer.invoke('storage:get', key),
    set: (key, value) => ipcRenderer.invoke('storage:set', key, value),
    remove: (key) => ipcRenderer.invoke('storage:remove', key)
  }
});
