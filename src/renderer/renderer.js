import {
  MAIN_ROWS,
  NAV_ROWS,
  NUMPAD,
  CODE_TO_ID,
  TESTABLE_COUNT,
} from './layout.js';

const U_GAP = 6; // styles.css --gap 와 동일해야 함

// 키 1개의 실제 너비(유닛 + 사이 간격 보정)를 px 계산식으로 반환.
function widthStyle(w) {
  if (!w || w === 1) return '';
  return `calc(var(--u) * ${w} + ${U_GAP}px * ${w - 1})`;
}

// id → DOM 엘리먼트 (상태 갱신용)
const keyEls = new Map();
// 한 번이라도 눌린(=테스트 완료) 키 id
const tested = new Set();
// 레이아웃에 없는(미매핑) keycode 들
const unmappedCodes = new Set();

function makeKey(key) {
  const el = document.createElement('div');
  const ws = widthStyle(key.w);
  if (key.spacer) {
    el.className = 'key spacer';
    if (ws) el.style.width = ws;
    return el;
  }
  el.className = 'key';
  el.dataset.id = key.id;
  el.textContent = key.label;
  if (ws) el.style.width = ws;
  if (key.code == null) {
    el.classList.add('unmappable');
    el.title = '이 키는 uiohook 표준 코드가 없어 자동 매핑되지 않습니다 (눌러도 미매핑 패널로 표시).';
  } else {
    keyEls.set(key.id, el);
  }
  return el;
}

function renderRowCluster(container, rows) {
  const cluster = document.createElement('div');
  cluster.className = 'cluster';
  for (const row of rows) {
    const rowEl = document.createElement('div');
    rowEl.className = 'krow';
    for (const key of row) rowEl.appendChild(makeKey(key));
    cluster.appendChild(rowEl);
  }
  container.appendChild(cluster);
}

function renderNumpad(container) {
  const grid = document.createElement('div');
  grid.className = 'numpad';
  for (const key of NUMPAD) {
    const el = makeKey(key);
    el.style.gridColumn = `${key.gc}${key.cs ? ` / span ${key.cs}` : ''}`;
    el.style.gridRow = `${key.gr}${key.rs ? ` / span ${key.rs}` : ''}`;
    grid.appendChild(el);
  }
  container.appendChild(grid);
}

function buildBoard() {
  const board = document.getElementById('board');
  renderRowCluster(board, MAIN_ROWS);
  renderRowCluster(board, NAV_ROWS);
  renderNumpad(board);
}

// ── 진행률 ────────────────────────────────────
const fillEl = document.getElementById('fill');
const countEl = document.getElementById('count');
const totalEl = document.getElementById('total');
const successBanner = document.getElementById('success');

function updateProgress() {
  const n = tested.size;
  countEl.textContent = String(n);
  totalEl.textContent = String(TESTABLE_COUNT);
  fillEl.style.width = `${(n / TESTABLE_COUNT) * 100}%`;
  successBanner.hidden = n < TESTABLE_COUNT;
}

// ── 미매핑 패널 ───────────────────────────────
const chipsEl = document.getElementById('chips');
function renderUnmapped() {
  if (unmappedCodes.size === 0) {
    chipsEl.innerHTML = '<span class="empty">아직 없음 — 매핑되지 않은 키가 눌리면 여기 표시됩니다.</span>';
    return;
  }
  chipsEl.innerHTML = '';
  for (const code of unmappedCodes) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = `keycode ${code}`;
    chipsEl.appendChild(chip);
  }
}

// ── 키 이벤트 처리 ────────────────────────────
function handleKeyEvent(info) {
  const id = CODE_TO_ID.get(info.keycode);
  if (!id) {
    if (!unmappedCodes.has(info.keycode)) {
      unmappedCodes.add(info.keycode);
      renderUnmapped();
    }
    return;
  }
  const el = keyEls.get(id);
  if (!el) return;

  if (info.type === 'keydown') {
    el.classList.add('pressed');
    if (!tested.has(id)) {
      tested.add(id);
      el.classList.add('tested');
      updateProgress();
    }
  } else if (info.type === 'keyup') {
    el.classList.remove('pressed');
  }
}

function reset() {
  tested.clear();
  unmappedCodes.clear();
  for (const el of keyEls.values()) {
    el.classList.remove('tested', 'pressed');
  }
  updateProgress();
  renderUnmapped();
}

// ── 초기화 ────────────────────────────────────
buildBoard();
updateProgress();
renderUnmapped();

document.getElementById('reset').addEventListener('click', reset);

window.keyboardAPI.onKeyEvent(handleKeyEvent);
window.keyboardAPI.onHookError((message) => {
  const banner = document.getElementById('error');
  banner.hidden = false;
  banner.textContent = `❌ 네이티브 키보드 훅 로드 실패: ${message} — 'npm run rebuild' 후 다시 실행하세요.`;
});
