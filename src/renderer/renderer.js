import {
  MAIN_ROWS,
  NAV_ROWS,
  NUMPAD,
  CODE_TO_ID,
  CODE_TO_LABEL,
  TESTABLE_COUNT,
  UIOHOOK_KEY_NAMES,
} from './layout.js';

// 히스토리에 보관할 최대 항목 수.
const MAX_HISTORY = 100;

// keycode 를 사람이 읽는 이름으로 해석한다.
// 레이아웃 라벨 → uiohook 표준 이름 → raw keycode 순으로 폴백.
function keyName(code) {
  return CODE_TO_LABEL.get(code) || UIOHOOK_KEY_NAMES.get(code) || `keycode ${code}`;
}

// HH:MM:SS.mmm 형식의 시각 문자열.
function formatTime(date) {
  const p = (n, len = 2) => String(n).padStart(len, '0');
  return `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}.${p(date.getMilliseconds(), 3)}`;
}

const U_GAP = 6; // styles.css --gap 와 동일해야 함

// 키 1개의 실제 너비(유닛 + 사이 간격 보정)를 px 계산식으로 반환.
function widthStyle(w) {
  if (w == null || w === 1) return '';
  return `calc(var(--u) * ${w} + ${U_GAP}px * ${w - 1})`;
}

// id → DOM 엘리먼트 (상태 갱신용)
const keyEls = new Map();
// 한 번이라도 눌린(=테스트 완료) 키 id
const tested = new Set();
// 레이아웃에 없는(미매핑) keycode 들
const unmappedCodes = new Set();
// 키 입력 히스토리 (최신이 배열 끝). { name, time }
const history = [];
// 현재 눌려 있는 keycode 들 — 오토리피트(키 꾹 누름) 중복 기록 방지용.
const downCodes = new Set();

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
    chip.setAttribute('role', 'listitem');
    // uiohook 이 아는 keycode 면 키 이름을 함께 보여준다 (예: F13, CtrlRight).
    const name = UIOHOOK_KEY_NAMES.get(code);
    chip.textContent = name ? `${name} (keycode ${code})` : `keycode ${code}`;
    chipsEl.appendChild(chip);
  }
}

// ── 키 입력 히스토리 ──────────────────────────
const historyEl = document.getElementById('history');
const histCountEl = document.getElementById('hist-count');

// 히스토리 행 1개를 DOM 으로 만든다.
function makeHistoryRow(entry) {
  const row = document.createElement('div');
  row.className = 'hist-row';

  const time = document.createElement('span');
  time.className = 'hist-time';
  time.textContent = formatTime(entry.time);

  const name = document.createElement('span');
  name.className = 'hist-key';
  name.textContent = entry.name;

  row.append(time, name);
  return row;
}

// 전체 재구성 — 초기화/비우기 등 일괄 갱신 시에만 사용.
function renderHistory() {
  histCountEl.textContent = String(history.length);
  if (history.length === 0) {
    historyEl.innerHTML = '<span class="empty">아직 없음 — 키를 누르면 여기 기록됩니다.</span>';
    return;
  }
  historyEl.innerHTML = '';
  // 최신이 위로 오도록 역순 렌더.
  for (let i = history.length - 1; i >= 0; i--) {
    historyEl.appendChild(makeHistoryRow(history[i]));
  }
}

// 신규 항목 1개만 맨 위에 추가 — 매 입력마다 전체 재생성하지 않는다.
function prependHistoryRow(entry) {
  const empty = historyEl.querySelector('.empty');
  if (empty) empty.remove();
  historyEl.insertBefore(makeHistoryRow(entry), historyEl.firstChild);
  // 캡 초과분 DOM 정리 (배열은 recordHistory 에서 이미 shift 됨).
  while (historyEl.childElementCount > MAX_HISTORY) {
    historyEl.removeChild(historyEl.lastElementChild);
  }
  histCountEl.textContent = String(history.length);
}

// keydown 만 기록하되, 오토리피트 반복은 무시한다(첫 눌림만).
function recordHistory(info) {
  if (info.type === 'keyup') {
    downCodes.delete(info.keycode);
    return;
  }
  if (downCodes.has(info.keycode)) return;
  downCodes.add(info.keycode);

  const entry = { name: keyName(info.keycode), time: new Date() };
  history.push(entry);
  if (history.length > MAX_HISTORY) history.shift();
  prependHistoryRow(entry);
}

// ── 키 이벤트 처리 ────────────────────────────
function handleKeyEvent(info) {
  recordHistory(info);

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

function clearHistory() {
  history.length = 0;
  downCodes.clear();
  renderHistory();
}

function reset() {
  tested.clear();
  unmappedCodes.clear();
  for (const el of keyEls.values()) {
    el.classList.remove('tested', 'pressed');
  }
  updateProgress();
  renderUnmapped();
  clearHistory();
}

// ── 초기화 ────────────────────────────────────
buildBoard();
updateProgress();
renderUnmapped();
renderHistory();

document.getElementById('reset').addEventListener('click', reset);
document.getElementById('hist-clear').addEventListener('click', clearHistory);

window.keyboardAPI.onKeyEvent(handleKeyEvent);
window.keyboardAPI.onHookError((message) => {
  const banner = document.getElementById('error');
  banner.hidden = false;
  banner.textContent = `❌ 네이티브 키보드 훅 로드 실패: ${message} — 'npm run rebuild' 후 다시 실행하세요.`;
});
