// Electron 메인 프로세스 (Phase 0: 네이티브 훅 검증)
// uiohook-napi 로 OS 저수준 글로벌 키보드 훅을 걸어 모든 키 이벤트를 캡처한다.
// 브라우저 샌드박스 밖(메인 프로세스)에서 동작하므로 Windows 키 등 시스템 키도 잡힌다.

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

let mainWindow = null;
let uIOhook = null;
let UiohookKey = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    title: 'Keyboard Tester — Phase 0 검증',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 렌더러 진단: 콘솔/로드 실패를 메인 stdout 으로 끌어와 디버깅을 돕는다.
  const wc = mainWindow.webContents;
  wc.on('console-message', (_e, level, message, line, sourceId) => {
    console.log(`[renderer] ${message} (${sourceId}:${line})`);
  });
  wc.on('did-fail-load', (_e, code, desc, url) => {
    console.error(`[renderer] 로드 실패 ${code} ${desc} ${url}`);
  });
  wc.on('render-process-gone', (_e, details) => {
    console.error('[renderer] 프로세스 종료:', details);
  });
}

// 렌더러로 안전하게 이벤트를 보낸다 (창이 살아있을 때만).
function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function startKeyboardHook() {
  try {
    // require 를 여기서 하여, 네이티브 모듈 로드 실패 시 명확히 처리한다.
    ({ uIOhook, UiohookKey } = require('uiohook-napi'));
  } catch (err) {
    console.error('[FATAL] uiohook-napi 로드 실패 — electron-rebuild 가 필요할 수 있습니다.');
    console.error(err);
    sendToRenderer('hook-error', String(err && err.message ? err.message : err));
    return;
  }

  uIOhook.on('keydown', (e) => {
    const info = { type: 'keydown', keycode: e.keycode, rawcode: e.rawcode };
    console.log('keydown', info);
    sendToRenderer('key-event', info);
  });

  uIOhook.on('keyup', (e) => {
    const info = { type: 'keyup', keycode: e.keycode, rawcode: e.rawcode };
    console.log('keyup', info);
    sendToRenderer('key-event', info);
  });

  uIOhook.start();
  console.log('[OK] 글로벌 키보드 훅 시작됨. 이제 키를 눌러 콘솔/창에서 확인하세요.');
}

app.whenReady().then(() => {
  createWindow();
  startKeyboardHook();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 훅을 깨끗하게 정지한다 (정지하지 않으면 프로세스가 안 죽을 수 있다).
function stopKeyboardHook() {
  try {
    if (uIOhook) uIOhook.stop();
  } catch (err) {
    console.error('훅 정지 중 오류:', err);
  }
}

app.on('window-all-closed', () => {
  stopKeyboardHook();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', stopKeyboardHook);
