// Ponte mínima entre a app e o Windows (só o necessário para as atualizações)
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('gpDesktop', {
  version: () => ipcRenderer.invoke('gp-version'),
  checkUpdates: () => ipcRenderer.invoke('gp-check'),
  updateState: () => ipcRenderer.invoke('gp-state')
});
