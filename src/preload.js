// preload: 렌더러에 Node 전체를 노출하지 않고, 필요한 API만 안전하게 다리 놓는다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('keyboardAPI', {
  // 메인 프로세스에서 오는 키 이벤트를 구독한다.
  onKeyEvent: (callback) => {
    const listener = (_event, info) => callback(info);
    ipcRenderer.on('key-event', listener);
    return () => ipcRenderer.removeListener('key-event', listener);
  },
  // 네이티브 훅 로드 실패 같은 오류를 구독한다.
  onHookError: (callback) => {
    const listener = (_event, message) => callback(message);
    ipcRenderer.on('hook-error', listener);
    return () => ipcRenderer.removeListener('hook-error', listener);
  },
});
