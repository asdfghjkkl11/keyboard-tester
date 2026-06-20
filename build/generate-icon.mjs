// 앱 아이콘 생성기 — 풀 키보드 미니어처 디자인을 SVG 로 그린 뒤 PNG 로 래스터화한다.
// electron-builder 가 build/icon.png(1024px) 에서 Windows .ico 를 자동 생성한다.
// 실행: node build/generate-icon.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SIZE = 1024;
const buildDir = path.dirname(fileURLToPath(import.meta.url));

// ── 색상 (앱 UI 다크 테마와 일치) ──────────────────
const COLORS = {
  bgFrom: '#1b1f2a',
  bgTo: '#0d0f15',
  body: '#2b303d',
  bodyEdge: '#3a4150',
  cap: '#3d4452',
  capTop: '#4a5160',
  tested: '#34d399', // 그린 — 테스트 완료
  pressed: '#f59e0b', // 앰버 — 누르는 중
};

// ── 키보드 격자 레이아웃 ────────────────────────────
// 각 행: 칸(유닛) 수. 미니멀하게 5행으로 풀키보드 느낌만 전달.
const ROWS = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 숫자행
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5], // q행
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25], // a행
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75], // z행
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25], // 스페이스행
];

// 강조 키: [행, 칸] — 그린(완료) 여러 개 + 앰버(누름) 하나로 "테스트 중" 표현.
const TESTED = new Set(['0,2', '0,7', '1,4', '2,1', '2,9', '3,5', '4,3']);
const PRESSED = '2,5';

const board = { x: 96, y: 300, w: 832, h: 424, r: 44 };
const pad = 26; // 보드 안쪽 여백
const gap = 12; // 키 사이 간격
const rowH = (board.h - pad * 2 - gap * (ROWS.length - 1)) / ROWS.length;

function keycaps() {
  const out = [];
  ROWS.forEach((row, ri) => {
    const units = row.reduce((a, b) => a + b, 0);
    // 멀티유닛 키는 내부 gap 을 흡수하므로 gap 개수는 (units-1) 로 계산해야 행 폭이 정확히 맞는다.
    const unitW = (board.w - pad * 2 - gap * (units - 1)) / units;
    let cx = board.x + pad;
    const cy = board.y + pad + ri * (rowH + gap);
    row.forEach((u, ci) => {
      const w = u * unitW + gap * (u - 1);
      const key = `${ri},${ci}`;
      let fill = COLORS.cap;
      if (TESTED.has(key)) fill = COLORS.tested;
      if (key === PRESSED) fill = COLORS.pressed;
      out.push(
        `<rect x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" width="${w.toFixed(1)}" height="${rowH.toFixed(1)}" rx="9" fill="${fill}"/>`,
      );
      cx += w + gap;
    });
  });
  return out.join('\n      ');
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${COLORS.bgFrom}"/>
      <stop offset="1" stop-color="${COLORS.bgTo}"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" rx="180" fill="url(#bg)"/>
  <rect x="${board.x - 8}" y="${board.y - 8}" width="${board.w + 16}" height="${board.h + 16}" rx="${board.r + 6}" fill="${COLORS.bodyEdge}"/>
  <rect x="${board.x}" y="${board.y}" width="${board.w}" height="${board.h}" rx="${board.r}" fill="${COLORS.body}"/>
      ${keycaps()}
</svg>`;

const buf = Buffer.from(svg);
await sharp(buf).resize(SIZE, SIZE).png().toFile(path.join(buildDir, 'icon.png'));
console.log('build/icon.png (1024px) 생성 완료');
