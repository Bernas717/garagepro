// GaragePro para computador (Windows) — abre a mesma app (www/index.html) numa janela própria.
const { app, BrowserWindow, protocol, net, shell, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

// Origem fixa e segura (app://garagepro) para os dados (IndexedDB) ficarem sempre no mesmo sítio
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

if (!app.requestSingleInstanceLock()) { app.quit(); }
let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 840, minWidth: 380, minHeight: 600,
    backgroundColor: '#0b0d10', title: 'GaragePro', autoHideMenuBar: true,
    icon: path.join(__dirname, 'app', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false }
  });
  // Links externos (WhatsApp, GitHub, telefone…) abrem fora da app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?:|mailto:|tel:)/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://garagepro/')) { e.preventDefault(); if (/^(https?:|mailto:|tel:)/i.test(url)) shell.openExternal(url); }
  });
  win.loadURL('app://garagepro/index.html');
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

app.whenReady().then(() => {
  ipcMain.handle('gp-check', async () => 'As atualizações só funcionam na app instalada');
  Menu.setApplicationMenu(null);
  const root = path.join(__dirname, 'app');
  protocol.handle('app', (req) => {
    const u = new URL(req.url);
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.normalize(path.join(root, rel));
    if (!file.startsWith(root)) return new Response('Proibido', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
  setupUpdates();
});
app.on('window-all-closed', () => app.quit());

// ---------- Atualizações automáticas (GitHub Releases)
let updState = 'Ainda não verificado';
function setupUpdates() {
  if (!app.isPackaged) return;
  let autoUpdater;
  try { ({ autoUpdater } = require('electron-updater')); } catch (_) { return; }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('checking-for-update', () => updState = 'A procurar atualizações…');
  autoUpdater.on('update-not-available', () => updState = 'Estás na versão mais recente');
  autoUpdater.on('update-available', (i) => updState = 'A descarregar a versão ' + i.version + '…');
  autoUpdater.on('error', () => updState = 'Não foi possível verificar (sem internet?)');
  autoUpdater.on('update-downloaded', async (i) => {
    updState = 'Versão ' + i.version + ' pronta — instala ao fechar a app';
    const r = await dialog.showMessageBox(win, { type: 'info', buttons: ['Reiniciar agora', 'Mais tarde'], defaultId: 0, cancelId: 1,
      title: 'GaragePro', message: 'Nova versão pronta (' + i.version + ')', detail: 'Os teus dados mantêm-se. Se escolheres "Mais tarde", instala quando fechares a app.' });
    if (r.response === 0) autoUpdater.quitAndInstall();
  });
  ipcMain.removeHandler('gp-check');
  ipcMain.handle('gp-check', async () => { try { await autoUpdater.checkForUpdates(); } catch (_) {} return updState; });
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 4000);
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 30 * 60 * 1000);
}
ipcMain.handle('gp-state', () => updState);
ipcMain.handle('gp-version', () => app.getVersion());
