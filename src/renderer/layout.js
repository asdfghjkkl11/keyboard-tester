// 풀사이즈 104키 키보드 레이아웃 데이터 (ANSI).
// 각 키: { id, label, code, alt?, w?, spacer? }
//  - code: uiohook-napi 의 keycode (UiohookKey 값). 이벤트의 e.keycode 와 매칭.
//  - alt:  같은 물리 키가 보내는 다른 keycode 목록 (예: NumLock off 시 넘버패드).
//  - w:    키 너비(유닛, 1 = 표준). 생략 시 1.
//  - spacer: 시각적 간격용 빈 칸 (테스트 대상 아님).
// 모든 키에 uiohook keycode 가 매핑되어 있다(Pause=3653, Menu=3677 등 확장키 포함).
// 레이아웃에 없는 keycode 가 들어오면 렌더러 "미매핑" 패널에 raw 로 표시된다.

const sp = (w) => ({ spacer: true, w });

export const MAIN_ROWS = [
  // 펑션 행
  [
    { id: 'Escape', label: 'Esc', code: 1 },
    sp(1),
    { id: 'F1', label: 'F1', code: 59 },
    { id: 'F2', label: 'F2', code: 60 },
    { id: 'F3', label: 'F3', code: 61 },
    { id: 'F4', label: 'F4', code: 62 },
    sp(0.5),
    { id: 'F5', label: 'F5', code: 63 },
    { id: 'F6', label: 'F6', code: 64 },
    { id: 'F7', label: 'F7', code: 65 },
    { id: 'F8', label: 'F8', code: 66 },
    sp(0.5),
    { id: 'F9', label: 'F9', code: 67 },
    { id: 'F10', label: 'F10', code: 68 },
    { id: 'F11', label: 'F11', code: 87 },
    { id: 'F12', label: 'F12', code: 88 },
  ],
  // 숫자 행
  [
    { id: 'Backquote', label: '` ~', code: 41 },
    { id: 'Digit1', label: '1 !', code: 2 },
    { id: 'Digit2', label: '2 @', code: 3 },
    { id: 'Digit3', label: '3 #', code: 4 },
    { id: 'Digit4', label: '4 $', code: 5 },
    { id: 'Digit5', label: '5 %', code: 6 },
    { id: 'Digit6', label: '6 ^', code: 7 },
    { id: 'Digit7', label: '7 &', code: 8 },
    { id: 'Digit8', label: '8 *', code: 9 },
    { id: 'Digit9', label: '9 (', code: 10 },
    { id: 'Digit0', label: '0 )', code: 11 },
    { id: 'Minus', label: '- _', code: 12 },
    { id: 'Equal', label: '= +', code: 13 },
    { id: 'Backspace', label: 'Backspace', code: 14, w: 2 },
  ],
  // 상단 문자 행
  [
    { id: 'Tab', label: 'Tab', code: 15, w: 1.5 },
    { id: 'KeyQ', label: 'Q', code: 16 },
    { id: 'KeyW', label: 'W', code: 17 },
    { id: 'KeyE', label: 'E', code: 18 },
    { id: 'KeyR', label: 'R', code: 19 },
    { id: 'KeyT', label: 'T', code: 20 },
    { id: 'KeyY', label: 'Y', code: 21 },
    { id: 'KeyU', label: 'U', code: 22 },
    { id: 'KeyI', label: 'I', code: 23 },
    { id: 'KeyO', label: 'O', code: 24 },
    { id: 'KeyP', label: 'P', code: 25 },
    { id: 'BracketLeft', label: '[ {', code: 26 },
    { id: 'BracketRight', label: '] }', code: 27 },
    { id: 'Backslash', label: '\\ |', code: 43, w: 1.5 },
  ],
  // 홈 행
  [
    { id: 'CapsLock', label: 'Caps', code: 58, w: 1.75 },
    { id: 'KeyA', label: 'A', code: 30 },
    { id: 'KeyS', label: 'S', code: 31 },
    { id: 'KeyD', label: 'D', code: 32 },
    { id: 'KeyF', label: 'F', code: 33 },
    { id: 'KeyG', label: 'G', code: 34 },
    { id: 'KeyH', label: 'H', code: 35 },
    { id: 'KeyJ', label: 'J', code: 36 },
    { id: 'KeyK', label: 'K', code: 37 },
    { id: 'KeyL', label: 'L', code: 38 },
    { id: 'Semicolon', label: '; :', code: 39 },
    { id: 'Quote', label: "' \"", code: 40 },
    { id: 'Enter', label: 'Enter', code: 28, w: 2.25 },
  ],
  // 하단 문자 행
  [
    { id: 'ShiftLeft', label: 'Shift', code: 42, w: 2.25 },
    { id: 'KeyZ', label: 'Z', code: 44 },
    { id: 'KeyX', label: 'X', code: 45 },
    { id: 'KeyC', label: 'C', code: 46 },
    { id: 'KeyV', label: 'V', code: 47 },
    { id: 'KeyB', label: 'B', code: 48 },
    { id: 'KeyN', label: 'N', code: 49 },
    { id: 'KeyM', label: 'M', code: 50 },
    { id: 'Comma', label: ', <', code: 51 },
    { id: 'Period', label: '. >', code: 52 },
    { id: 'Slash', label: '/ ?', code: 53 },
    { id: 'ShiftRight', label: 'Shift', code: 54, w: 2.75 },
  ],
  // 최하단 행 (한국어 키보드 103/106키)
  // 오른쪽 Alt 자리 = 한/영(112), 오른쪽 Ctrl 자리 = 한자(121).
  [
    { id: 'ControlLeft', label: 'Ctrl', code: 29, w: 1.25 },
    { id: 'MetaLeft', label: 'Win', code: 3675, w: 1.25 },
    { id: 'AltLeft', label: 'Alt', code: 56, w: 1.25 },
    { id: 'Space', label: 'Space', code: 57, w: 6.25 },
    { id: 'HangulEnglish', label: '한/영', code: 112, w: 1.25 },
    { id: 'MetaRight', label: 'Fn', code: 3676, w: 1.25 },
    { id: 'ContextMenu', label: 'Menu', code: 3677, w: 1.25 },
    { id: 'Hanja', label: '한자', code: 121, w: 1.25 },
  ],
];

// 내비게이션 클러스터 — 메인 블록 6줄과 행 높이를 정확히 맞춘다.
// 0:PrtSc(펑션행) 1:Ins(숫자행) 2:Del(Tab행) 3:빈(Caps행) 4:↑(Shift행) 5:방향(Ctrl행)
export const NAV_ROWS = [
  [
    { id: 'PrintScreen', label: 'PrtSc', code: 3639 },
    { id: 'ScrollLock', label: 'ScrLk', code: 70 },
    { id: 'Pause', label: 'Pause', code: 3653 },
  ],
  [
    { id: 'Insert', label: 'Ins', code: 3666 },
    { id: 'Home', label: 'Home', code: 3655 },
    { id: 'PageUp', label: 'PgUp', code: 3657 },
  ],
  [
    { id: 'Delete', label: 'Del', code: 3667 },
    { id: 'End', label: 'End', code: 3663 },
    { id: 'PageDown', label: 'PgDn', code: 3665 },
  ],
  [sp(3)],
  [
    sp(1),
    { id: 'ArrowUp', label: '↑', code: 57416 },
    sp(1),
  ],
  [
    { id: 'ArrowLeft', label: '←', code: 57419 },
    { id: 'ArrowDown', label: '↓', code: 57424 },
    { id: 'ArrowRight', label: '→', code: 57421 },
  ],
];

// 넘버패드 — CSS Grid (4열). gr/gc = grid-row/column, rs/cs = row/col span.
// alt 는 NumLock OFF 시 보내는 keycode.
// 1행: 넘버패드 위 미디어 키 4개 (음량/음소거/계산기 — 확장키).
export const NUMPAD = [
  { id: 'AudioVolumeUp', label: '음량+', code: 57392, gr: 1, gc: 1 },
  { id: 'AudioVolumeDown', label: '음량−', code: 57390, gr: 1, gc: 2 },
  { id: 'AudioMute', label: '음소거', code: 57376, gr: 1, gc: 3 },
  { id: 'LaunchCalculator', label: '계산기', code: 57377, gr: 1, gc: 4 },

  { id: 'NumLock', label: 'Num', code: 69, gr: 2, gc: 1 },
  { id: 'NumpadDivide', label: '/', code: 3637, gr: 2, gc: 2 },
  { id: 'NumpadMultiply', label: '*', code: 55, gr: 2, gc: 3 },
  { id: 'NumpadSubtract', label: '-', code: 74, gr: 2, gc: 4 },

  { id: 'Numpad7', label: '7', code: 71, alt: [60999], gr: 3, gc: 1 },
  { id: 'Numpad8', label: '8', code: 72, alt: [61000], gr: 3, gc: 2 },
  { id: 'Numpad9', label: '9', code: 73, alt: [61001], gr: 3, gc: 3 },
  { id: 'NumpadAdd', label: '+', code: 78, gr: 3, gc: 4, rs: 2 },

  { id: 'Numpad4', label: '4', code: 75, alt: [61003], gr: 4, gc: 1 },
  { id: 'Numpad5', label: '5', code: 76, gr: 4, gc: 2 },
  { id: 'Numpad6', label: '6', code: 77, alt: [61005], gr: 4, gc: 3 },

  { id: 'Numpad1', label: '1', code: 79, alt: [61007], gr: 5, gc: 1 },
  { id: 'Numpad2', label: '2', code: 80, alt: [61008], gr: 5, gc: 2 },
  { id: 'Numpad3', label: '3', code: 81, alt: [61009], gr: 5, gc: 3 },
  { id: 'NumpadEnter', label: 'Enter', code: 3612, gr: 5, gc: 4, rs: 2 },

  { id: 'Numpad0', label: '0', code: 82, alt: [61010], gr: 6, gc: 1, cs: 2 },
  { id: 'NumpadDecimal', label: '.', code: 83, alt: [61011], gr: 6, gc: 3 },
];

// 모든 테스트 대상 키를 평탄화한 배열.
export const ALL_KEYS = [
  ...MAIN_ROWS.flat(),
  ...NAV_ROWS.flat(),
  ...NUMPAD,
].filter((k) => !k.spacer && k.id);

// keycode(및 alt) → key id 조회 테이블.
export const CODE_TO_ID = (() => {
  const map = new Map();
  for (const key of ALL_KEYS) {
    if (key.code != null) map.set(key.code, key.id);
    if (Array.isArray(key.alt)) {
      for (const c of key.alt) map.set(c, key.id);
    }
  }
  return map;
})();

// keycode(및 alt) → 표시 라벨 조회 테이블. 히스토리 등에서 사람이 읽는 이름 표기에 사용.
export const CODE_TO_LABEL = (() => {
  const map = new Map();
  for (const key of ALL_KEYS) {
    if (key.code != null) map.set(key.code, key.label);
    if (Array.isArray(key.alt)) {
      for (const c of key.alt) map.set(c, key.label);
    }
  }
  return map;
})();

// 매핑된(테스트 가능한) 키 총 개수 — code 가 있는 키만.
export const TESTABLE_COUNT = ALL_KEYS.filter((k) => k.code != null).length;

// uiohook-napi 의 UiohookKey 표를 keycode → 이름으로 뒤집은 정적 테이블.
// 렌더러는 샌드박스라 네이티브 모듈을 require 할 수 없어, 고정 표를 그대로 박아둔다.
// 레이아웃에 없는(미매핑) keycode 라도 uiohook 이 아는 키면 이름으로 표시하기 위함
// (예: F13~F24, 오른쪽 Ctrl=3613, 오른쪽 Alt=3640).
// `npm ls uiohook-napi` 로 버전이 바뀌면 이 표도 갱신 필요.
export const UIOHOOK_KEY_NAMES = new Map([
  [1, 'Escape'],
  [2, '1'],
  [3, '2'],
  [4, '3'],
  [5, '4'],
  [6, '5'],
  [7, '6'],
  [8, '7'],
  [9, '8'],
  [10, '9'],
  [11, '0'],
  [12, 'Minus'],
  [13, 'Equal'],
  [14, 'Backspace'],
  [15, 'Tab'],
  [16, 'Q'],
  [17, 'W'],
  [18, 'E'],
  [19, 'R'],
  [20, 'T'],
  [21, 'Y'],
  [22, 'U'],
  [23, 'I'],
  [24, 'O'],
  [25, 'P'],
  [26, 'BracketLeft'],
  [27, 'BracketRight'],
  [28, 'Enter'],
  [29, 'Ctrl'],
  [30, 'A'],
  [31, 'S'],
  [32, 'D'],
  [33, 'F'],
  [34, 'G'],
  [35, 'H'],
  [36, 'J'],
  [37, 'K'],
  [38, 'L'],
  [39, 'Semicolon'],
  [40, 'Quote'],
  [41, 'Backquote'],
  [42, 'Shift'],
  [43, 'Backslash'],
  [44, 'Z'],
  [45, 'X'],
  [46, 'C'],
  [47, 'V'],
  [48, 'B'],
  [49, 'N'],
  [50, 'M'],
  [51, 'Comma'],
  [52, 'Period'],
  [53, 'Slash'],
  [54, 'ShiftRight'],
  [55, 'NumpadMultiply'],
  [56, 'Alt'],
  [57, 'Space'],
  [58, 'CapsLock'],
  [59, 'F1'],
  [60, 'F2'],
  [61, 'F3'],
  [62, 'F4'],
  [63, 'F5'],
  [64, 'F6'],
  [65, 'F7'],
  [66, 'F8'],
  [67, 'F9'],
  [68, 'F10'],
  [69, 'NumLock'],
  [70, 'ScrollLock'],
  [71, 'Numpad7'],
  [72, 'Numpad8'],
  [73, 'Numpad9'],
  [74, 'NumpadSubtract'],
  [75, 'Numpad4'],
  [76, 'Numpad5'],
  [77, 'Numpad6'],
  [78, 'NumpadAdd'],
  [79, 'Numpad1'],
  [80, 'Numpad2'],
  [81, 'Numpad3'],
  [82, 'Numpad0'],
  [83, 'NumpadDecimal'],
  [87, 'F11'],
  [88, 'F12'],
  [91, 'F13'],
  [92, 'F14'],
  [93, 'F15'],
  [99, 'F16'],
  [100, 'F17'],
  [101, 'F18'],
  [102, 'F19'],
  [103, 'F20'],
  [104, 'F21'],
  [105, 'F22'],
  [106, 'F23'],
  [107, 'F24'],
  [3612, 'NumpadEnter'],
  [3613, 'CtrlRight'],
  [3637, 'NumpadDivide'],
  [3639, 'PrintScreen'],
  [3640, 'AltRight'],
  [3655, 'Home'],
  [3657, 'PageUp'],
  [3663, 'End'],
  [3665, 'PageDown'],
  [3666, 'Insert'],
  [3667, 'Delete'],
  [3675, 'Meta'],
  [3676, 'MetaRight'],
  [57416, 'ArrowUp'],
  [57419, 'ArrowLeft'],
  [57421, 'ArrowRight'],
  [57424, 'ArrowDown'],
  [60999, 'NumpadHome'],
  [61000, 'NumpadArrowUp'],
  [61001, 'NumpadPageUp'],
  [61003, 'NumpadArrowLeft'],
  [61005, 'NumpadArrowRight'],
  [61007, 'NumpadEnd'],
  [61008, 'NumpadArrowDown'],
  [61009, 'NumpadPageDown'],
  [61010, 'NumpadInsert'],
  [61011, 'NumpadDelete'],
]);
