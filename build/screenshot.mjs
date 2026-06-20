// README 용 스크린샷 생성기 — 실제 앱 UI 를 Electron capturePage 로 캡처한다.
// 일부 키를 '테스트 완료/누름' 상태로 칠해 실사용 모습을 보여준다.
// 실행: npx electron build/screenshot.mjs  (결과: docs/screenshot.png)
import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, 'docs');

// 렌더러에서 실행할 데모 상태 페인팅 스크립트.
const PAINT = `(() => {
  const tested = ['Escape','F1','F5','KeyW','KeyA','KeyS','KeyD','Space','Enter',
    'Digit1','Digit2','KeyQ','KeyE','KeyR','ArrowUp','ArrowLeft','ArrowDown',
    'Numpad1','Numpad2','NumLock','ShiftLeft','ControlLeft','HangulEnglish'];
  const pressed = ['Space','KeyD'];
  for (const id of tested) {
    const el = document.querySelector('[data-id="'+id+'"]');
    if (el) el.classList.add('tested');
  }
  for (const id of pressed) {
    const el = document.querySelector('[data-id="'+id+'"]');
    if (el) el.classList.add('pressed');
  }
  // 진행률 표시 갱신.
  const total = Number(document.getElementById('total').textContent) || 0;
  const n = tested.length;
  document.getElementById('count').textContent = String(n);
  document.getElementById('fill').style.width = (total ? (n/total*100) : 0) + '%';
})();`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    useContentSize: true,
    width: 1280,
    height: 600,
    show: false,
    webPreferences: {
      preload: path.join(root, 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  await win.loadFile(path.join(root, 'src', 'renderer', 'index.html'));
  await win.webContents.executeJavaScript(PAINT);
  // 레이아웃/페인트 안정화 대기.
  await new Promise((r) => setTimeout(r, 400));

  const image = await win.webContents.capturePage();
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'screenshot.png'), image.toPNG());
  console.log('docs/screenshot.png 생성 완료');
  app.quit();
});
