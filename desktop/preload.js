// Ponte mínima entre a app e o Windows (atualizações, notificações e barra de título)
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('gpDesktop', {
  version: () => ipcRenderer.invoke('gp-version'),
  checkUpdates: () => ipcRenderer.invoke('gp-check'),
  updateState: () => ipcRenderer.invoke('gp-state'),
  installNow: () => ipcRenderer.invoke('gp-install'),
  isFocused: () => ipcRenderer.invoke('gp-focused'),
  notify: (o) => ipcRenderer.invoke('gp-notify', { title: String(o && o.title || ''), body: String(o && o.body || '') }),
  setTitleBar: (o) => ipcRenderer.invoke('gp-titlebar', { color: String(o && o.color || ''), symbolColor: String(o && o.symbolColor || '') }),
  onUpdate: (cb) => { ipcRenderer.on('gp-update', (_e, v) => { try { cb(v); } catch (_) {} }); ipcRenderer.send('gp-ready'); }
});
