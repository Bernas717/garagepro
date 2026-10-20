// GaragePro para computador (Windows) — abre a mesma app (www/index.html) numa janela própria.
const { app, BrowserWindow, protocol, net, shell, ipcMain, Menu, Notification, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const APP_ID = 'pt.bbtecnodev.garagepro.pc';
// Origem fixa e segura (app://garagepro) para os dados (IndexedDB) ficarem sempre no mesmo sítio
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

if (!app.requestSingleInstanceLock()) { app.quit(); }
app.setAppUserModelId(APP_ID); // necessário para as notificações do Windows
let win = null;
const ICON = path.join(__dirname, 'app', 'icon.png');

// ---------- Lembrar tamanho, posição e se estava maximizada
const STATE_FILE = () => path.join(app.getPath('userData'), 'janela.json');
function loadState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_FILE(), 'utf8'));
    const area = screen.getDisplayMatching({ x: s.x, y: s.y, width: s.width, height: s.height }).workArea;
    const visible = s.x < area.x + area.width - 80 && s.y < area.y + area.height - 80 && s.x + s.width > area.x + 80 && s.y >= area.y - 20;
    return visible ? s : { width: s.width, height: s.height, maximized: s.maximized };
  } catch (_) { return { width: 1360, height: 860 }; }
}
function saveState() {
  if (!win) return;
  try {
    const b = win.getNormalBounds();
    fs.writeFileSync(STATE_FILE(), JSON.stringify({ ...b, maximized: win.isMaximized() }));
  } catch (_) {}
}

function createWindow() {
  const st = loadState();
  win = new BrowserWindow({
    x: st.x, y: st.y, width: st.width || 1360, height: st.height || 860, minWidth: 380, minHeight: 600,
    show: false, backgroundColor: '#0b0d10', title: 'GaragePro', icon: ICON,
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#0b0d10', symbolColor: '#eceef2', height: 36 },
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false }
  });
  if (st.maximized) win.maximize();
  win.once('ready-to-show', () => win.show());
  let t; const later = () => { clearTimeout(t); t = setTimeout(saveState, 400); };
  win.on('resize', later); win.on('move', later); win.on('close', saveState);
  // F11: ecrã inteiro
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type === 'keyDown' && i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  // Links externos (WhatsApp, GitHub, telefone…) abrem fora da app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?:|mailto:|tel:)/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://garagepro/')) { e.preventDefault(); if (/^(https?:|mailto:|tel:)/i.test(url)) shell.openExternal(url); }
  });
  win.webContents.on('will-attach-webview', (e) => e.preventDefault());
  win.loadURL('app://garagepro/index.html');
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  // A app não precisa de câmara, microfone, localização, etc.: recusa tudo exceto notificações e copiar texto
  const { session } = require('electron');
  const OK_PERM = new Set(['notifications', 'clipboard-sanitized-write', 'fullscreen']);
  session.defaultSession.setPermissionRequestHandler((_wc, perm, cb) => cb(OK_PERM.has(perm)));
  session.defaultSession.setPermissionCheckHandler((_wc, perm) => OK_PERM.has(perm));
  const root = path.join(__dirname, 'app');
  protocol.handle('app', (req) => {
    const u = new URL(req.url);
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.normalize(path.join(root, rel));
    // só ficheiros dentro da pasta da app (com separador, para não aceitar pastas vizinhas como "app2")
    if (file !== root && !file.startsWith(root + path.sep)) return new Response('Proibido', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  ipcMain.handle('gp-check', async () => 'As atualizações só funcionam na app instalada');
  createWindow();
  setupUpdates();
});
app.on('window-all-closed', () => app.quit());

// ---------- Ponte com a app
ipcMain.handle('gp-version', () => app.getVersion());
ipcMain.handle('gp-focused', () => !!(win && win.isFocused() && win.isVisible() && !win.isMinimized()));
ipcMain.handle('gp-titlebar', (_e, o) => {
  try { if (win && o && /^#[0-9a-f]{3,8}$/i.test(o.color) && /^#[0-9a-f]{3,8}$/i.test(o.symbolColor)) { win.setTitleBarOverlay({ color: o.color, symbolColor: o.symbolColor, height: 36 }); win.setBackgroundColor(o.color); } } catch (_) {}
  return true;
});
ipcMain.handle('gp-notify', (_e, o) => { winNotify(String(o && o.title || 'GaragePro').slice(0, 120), String(o && o.body || '').slice(0, 300)); return true; });
function winNotify(title, body, onClick) {
  if (!Notification.isSupported()) return;
  const n = new Notification({ title, body, icon: ICON, silent: false });
  n.on('click', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } if (onClick) onClick(); });
  n.show();
}
const send = (ch, v) => { try { if (win && !win.isDestroyed()) win.webContents.send(ch, v); } catch (_) {} };

// ---------- Atualizações automáticas (GitHub Releases)
let updState = 'Ainda não verificado', updReady = null;
function setupUpdates() {
  if (!app.isPackaged) return;
  let autoUpdater;
  try { ({ autoUpdater } = require('electron-updater')); } catch (_) { return; }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('checking-for-update', () => updState = 'A procurar atualizações…');
  autoUpdater.on('update-not-available', () => { updState = 'Estás na versão mais recente'; send('gp-update', { state: 'none' }); });
  autoUpdater.on('update-available', (i) => { updState = 'A descarregar a versão ' + i.version + '…'; send('gp-update', { state: 'available', version: i.version }); });
  autoUpdater.on('error', () => updState = 'Não foi possível verificar (sem internet?)');
  autoUpdater.on('update-downloaded', (i) => {
    updState = 'Versão ' + i.version + ' pronta — instala ao fechar a app'; updReady = i.version;
    send('gp-update', { state: 'downloaded', version: i.version });
    winNotify('GaragePro ' + i.version + ' pronto a instalar', 'Clica para reiniciar e atualizar. Os teus dados mantêm-se.', () => autoUpdater.quitAndInstall());
  });
  ipcMain.removeHandler('gp-check');
  ipcMain.handle('gp-check', async () => { try { await autoUpdater.checkForUpdates(); } catch (_) {} return updState; });
  ipcMain.handle('gp-install', () => { if (updReady) autoUpdater.quitAndInstall(); return !!updReady; });
  // a app pode pedir o estado quando acaba de abrir (para mostrar o aviso bonito)
  ipcMain.on('gp-ready', () => { if (updReady) send('gp-update', { state: 'downloaded', version: updReady }); });
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 4000);
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 30 * 60 * 1000);
}
ipcMain.handle('gp-state', () => updState);
