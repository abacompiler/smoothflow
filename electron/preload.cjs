const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('smoothflowDesktop', {
  isDesktop: true,
  platform: process.platform
});
