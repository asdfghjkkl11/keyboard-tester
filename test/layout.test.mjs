import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_KEYS,
  CODE_TO_ID,
  TESTABLE_COUNT,
} from '../src/renderer/layout.js';

test('모든 키는 id 를 가진다', () => {
  for (const key of ALL_KEYS) {
    assert.ok(key.id, `id 누락: ${JSON.stringify(key)}`);
  }
});

test('키 id 는 중복되지 않는다', () => {
  const ids = ALL_KEYS.map((k) => k.id);
  assert.equal(new Set(ids).size, ids.length, '중복 id 존재');
});

test('keycode(및 alt) 매핑에 충돌이 없다', () => {
  const seen = new Map();
  for (const key of ALL_KEYS) {
    const codes = [];
    if (key.code != null) codes.push(key.code);
    if (Array.isArray(key.alt)) codes.push(...key.alt);
    for (const c of codes) {
      assert.ok(
        !seen.has(c),
        `keycode ${c} 가 ${seen.get(c)} 와 ${key.id} 에 중복 매핑됨`,
      );
      seen.set(c, key.id);
    }
  }
});

test('TESTABLE_COUNT 는 code 가 있는 키 수와 일치한다', () => {
  const withCode = ALL_KEYS.filter((k) => k.code != null).length;
  assert.equal(TESTABLE_COUNT, withCode);
});

test('주요 키가 올바른 keycode 로 매핑된다', () => {
  assert.equal(CODE_TO_ID.get(3675), 'MetaLeft'); // 왼쪽 Win
  assert.equal(CODE_TO_ID.get(112), 'HangulEnglish'); // 한/영
  assert.equal(CODE_TO_ID.get(121), 'Hanja'); // 한자
  assert.equal(CODE_TO_ID.get(3653), 'Pause');
  assert.equal(CODE_TO_ID.get(3677), 'ContextMenu'); // Menu
  assert.equal(CODE_TO_ID.get(57392), 'AudioVolumeUp');
});

test('넘버패드 NumLock-off alt 코드도 같은 키로 매핑된다', () => {
  assert.equal(CODE_TO_ID.get(71), 'Numpad7'); // NumLock on
  assert.equal(CODE_TO_ID.get(60999), 'Numpad7'); // NumLock off (Home)
});
