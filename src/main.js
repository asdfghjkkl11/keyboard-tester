// Electron 메인 프로세스
// uiohook-napi 로 OS 저수준 글로벌 키보드 훅을 걸어 모든 키 이벤트를 캡처한다.
// 브라우저 샌드박스 밖(메인 프로세스)에서 동작하므로 Windows 키 등 시스템 키도 잡힌다.
//
// 키 차단(포커스 시 OS 동작 막기): hook.ps1(C# WH_KEYBOARD_LL)을 먼저 설치하고
// 그 다음 uiohook 을 설치한다. WH_KEYBOARD_LL 체인은 "나중에 설치된 훅이 먼저 호출"되는
// Windows 구현 동작을 이용한다 → uiohook 이 먼저 호출되어 감지 후 통과시키고,
// 이어서 C# 훅이 return 1 로 삼킨다. 이는 보장된 계약이 아니라 구현 동작이므로,
// 헬퍼 설치가 5초 내 확인되지 않으면 차단 없이(감지만으로) 진행한다.

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

const HOOK_TIMEOUT_MS = 5000;
const MAX_KEYCODE = 0xffff;

let mainWindow = null;
let uIOhook = null;
let UiohookKey = null;
let blockerProc = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    // useContentSize: 크기를 (타이틀바 제외) 웹 콘텐츠 영역 기준으로 잡아
    // 전체 키보드가 처음부터 다 보이도록 한다.
    useContentSize: true,
    width: 1280,
    height: 600,
    minWidth: 1160,
    minHeight: 600,
    center: true,
    title: '키보드 테스트',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  const wc = mainWindow.webContents;
  // 렌더러 콘솔 미러링은 개발 모드에서만 (배포본에서 렌더러 상태 노출 방지).
  if (!app.isPackaged) {
    wc.on('console-message', (_e, _level, message, line, sourceId) => {
      console.log(`[renderer] ${message} (${sourceId}:${line})`);
    });
  }
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
// 스크립트는 임시 파일 없이 stdin(-Command -)으로 전달한다
// → 임시파일 경로 탈취(TOCTOU)/잔존 위험 제거, 실행정책 영향 없음.
// 설치 완료(HOOK_INSTALLED) 시 true, 실패/타임아웃 시 false 로 resolve.
function startKeyBlocker(targetPid) {
  return new Promise((resolve) => {
    let script;
    try {
      script = fs.readFileSync(path.join(__dirname, 'hook.ps1'), 'utf8');
    } catch (err) {
      console.error('[blocker] 스크립트 로드 실패 — 차단 없이 진행:', err.message);
      return resolve(false);
    }

    blockerProc = spawn('powershell.exe', ['-NoProfile', '-Command', '-'], {
      windowsHide: true,
    });

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
      done(false);
    });

    // targetPid 는 신뢰된 정수(process.pid). 타입 정의 뒤에 실행 호출을 덧붙여 stdin 으로 전달.
    blockerProc.stdin.write(`${script}\n[KbBlocker]::Run([uint32]${targetPid})\n`);
    blockerProc.stdin.end();

    setTimeout(() => done(false), HOOK_TIMEOUT_MS);
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
    ({ uIOhook, UiohookKey } = require('uiohook-napi'));
  } catch (err) {
    console.error('[FATAL] uiohook-napi 로드 실패 — electron-rebuild 가 필요할 수 있습니다.');
    console.error(err);
    sendToRenderer('hook-error', 'LOAD_FAILED');
    return;
  }

  // 네이티브 페이로드를 검증한 뒤 필요한 값(type, keycode)만 렌더러로 전달한다.
  const forward = (type) => (e) => {
    const keycode = Number(e.keycode);
    if (!Number.isInteger(keycode) || keycode < 0 || keycode > MAX_KEYCODE) return;
    if (process.env.DEBUG_KEYS) console.log(type, keycode);
    sendToRenderer('key-event', { type, keycode });
  };
  uIOhook.on('keydown', forward('keydown'));
  uIOhook.on('keyup', forward('keyup'));

  uIOhook.start();
  console.log('[OK] 글로벌 키보드 훅 시작됨.');
}

app.whenReady().then(async () => {
  // 기본 영어 메뉴바(File/Edit/View…)는 키보드 테스터에 불필요하므로 제거.
  Menu.setApplicationMenu(null);
  createWindow();

  // C# 차단 훅을 먼저 설치한 뒤 uiohook 을 시작해야 체인 순서가 보장된다.
  await startKeyBlocker(process.pid);

  // 렌더러가 준비된 뒤 감지를 시작해 초기 키 이벤트 유실을 막는다.
  if (mainWindow && mainWindow.webContents.isLoading()) {
    await new Promise((resolve) => {
      const wc = mainWindow.webContents;
      wc.once('did-finish-load', resolve);
      wc.once('did-fail-load', resolve);
      setTimeout(resolve, HOOK_TIMEOUT_MS);
    });
  }
  startKeyboardHook();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

function stopKeyboardHook() {
  try {
    if (uIOhook) uIOhook.stop();
  } catch (err) {
    console.error('훅 정지 중 오류:', err);
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 정상 종료 정리는 before-quit 한 곳에서 수행한다(중복 호출 방지).
app.on('before-quit', () => {
  stopKeyboardHook();
  stopKeyBlocker();
});

// 비정상 종료(크래시 등)에도 헬퍼 프로세스가 좀비로 남지 않도록 동기적으로 정리.
process.on('exit', () => {
  if (blockerProc && !blockerProc.killed) {
    try {
      blockerProc.kill();
    } catch (_e) {
      /* 종료 중이므로 무시 */
    }
  }
});
