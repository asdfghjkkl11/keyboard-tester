# Keyboard Tester

물리 키보드의 모든 키가 정상적으로 입력되는지 확인하는 데스크톱 앱.

## 왜 Electron인가

브라우저는 보안 샌드박스 때문에 `Windows 키`, 시스템 단축키 등 일부 키를 가로채지 못한다.
이 앱은 **Electron 메인 프로세스에서 OS 저수준 키보드 훅(`uiohook-napi`)** 으로 모든 키를
포착해 렌더러(키보드 레이아웃 UI)에 전달한다.

| 방식 | 모든 키 캡처 |
|------|:---:|
| 순수 웹 / WASM (브라우저 샌드박스) | ❌ Windows 키 등 불가 |
| Electron + 네이티브 훅 (OS 위 실행) | ✅ |

## 한계

- `Fn` 키는 키보드 펌웨어에서 처리되어 OS까지 도달하지 않으므로 어떤 소프트웨어로도 감지 불가.

## 개발

```bash
npm install
npm start
```

## 빌드 (portable exe)

```bash
npm run build
```

## 기술 스택

- Electron (Chromium + Node.js)
- uiohook-napi (전역 키보드 훅)
- electron-builder (패키징)
