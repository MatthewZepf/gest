const { contextBridge, ipcRenderer } = require('electron');


console.log('Preloader loaded');

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: ipcRenderer,
  getPort: () => ipcRenderer.invoke('get-port'),
  readSettings: () => ipcRenderer.invoke('read-settings'),
  writeSettings: (newSettings) => ipcRenderer.invoke('write-settings', newSettings),
});