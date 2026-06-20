// Electron 메인 프로세스
// uiohook-napi 로 OS 저수준 글로벌 키보드 훅을 걸어 모든 키 이벤트를 캡처한다.
// 브라우저 샌드박스 밖(메인 프로세스)에서 동작하므로 Windows 키 등 시스템 키도 잡힌다.
//
// 키 차단(포커스 시 OS 동작 막기): hook.ps1(C# WH_KEYBOARD_LL)을 먼저 설치하고,
// 그 다음 uiohook 을 설치한다. 훅 체인은 "나중에 설치된 것이 먼저 호출"되므로
// uiohook 이 먼저 호출되어 감지한 뒤 통과시키고, 이어서 C# 훅이 return 1 로 삼킨다.
// → 기존 감지/레이아웃은 그대로 두고 차단만 추가된다.

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawn } = require('node:child_process');

let mainWindow = null;
let uIOhook = null;
let UiohookKey = null;
let blockerProc = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    // useContentSize: 아래 크기를 (타이틀바 제외) 웹 콘텐츠 영역 기준으로 잡는다.
    // 전체 키보드(약 1023×561)가 처음부터 다 보이도록 여유를 둔다.
    useContentSize: true,
    width: 1280,
    height: 600,
    minWidth: 1160,
    minHeight: 600,
    center: true,
    title: 'Keyboard Tester',
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

// C# 저수준 훅 헬퍼를 띄워, 우리 창이 포커스됐을 때 키의 OS 동작을 차단한다.
// 설치 완료(HOOK_INSTALLED) 시 true, 실패/타임아웃 시 false 로 resolve.
// 실패해도 앱은 차단 없이(감지만) 계속 동작한다.
function startKeyBlocker(targetPid) {
  return new Promise((resolve) => {
    let psPath;
    try {
      // asar 내부 파일은 PowerShell 이 직접 못 읽으므로, 실제 임시 경로에 복사한다.
      const script = fs.readFileSync(path.join(__dirname, 'hook.ps1'), 'utf8');
      psPath = path.join(os.tmpdir(), 'keyboard-tester-hook.ps1');
      fs.writeFileSync(psPath, script, 'utf8');
    } catch (err) {
      console.error('[blocker] 스크립트 준비 실패 — 차단 없이 진행:', err.message);
      return resolve(false);
    }

    blockerProc = spawn(
      'powershell.exe',
      ['-NoProfile', '-File', psPath, String(targetPid)],
      { windowsHide: true },
    );

    let settled = false;
    const done = (ok) => {
      if (!settled) {
        settled = true;
        resolve(ok);
      }
    };

    blockerProc.stdout.on('data', (data) => {
      if (data.toString().includes('HOOK_INSTALLED')) {
        console.log('[blocker] 키 차단 훅 설치됨 (포커스 시 OS 동작 차단)');
        done(true);
      }
    });
    blockerProc.stderr.on('data', (data) => {
      console.error('[blocker] stderr:', data.toString().trim());
    });
    blockerProc.on('error', (err) => {
      console.error('[blocker] 실행 실패 — 차단 없이 진행:', err.message);
      done(false);
    });
    blockerProc.on('exit', (code) => {
      if (!settled) console.error(`[blocker] 설치 전 종료(code ${code}) — 차단 없이 진행`);
      blockerProc = null;
    });

    // 안전장치: 설치 신호가 5초 내 없으면 차단 없이 진행한다.
    setTimeout(() => done(false), 5000);
  });
}

function stopKeyBlocker() {
  if (blockerProc && !blockerProc.killed) {
    try {
      blockerProc.kill();
    } catch (err) {
      console.error('[blocker] 종료 중 오류:', err.message);
    }
  }
  blockerProc = null;
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

app.whenReady().then(async () => {
  // 기본 메뉴바(File/Edit/View… 영어)는 키보드 테스터에 불필요하므로 제거한다.
  Menu.setApplicationMenu(null);
  createWindow();
  // C# 차단 훅을 먼저 설치한 뒤 uiohook 을 시작해야 체인 순서가 보장된다.
  await startKeyBlocker(process.pid);
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
  stopKeyBlocker();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopKeyboardHook();
  stopKeyBlocker();
});
