param([int]$TargetPid)
$ErrorActionPreference = 'Stop'

# WH_KEYBOARD_LL 저수준 키보드 훅.
# 포그라운드 창의 PID 가 우리 앱($TargetPid)일 때만 키 이벤트를 삼킨다(return 1).
# 그 외에는 CallNextHookEx 로 그대로 통과시킨다.
# 감지는 Electron 쪽 uiohook 이 (이 훅보다 먼저 설치되어 체인 앞에서) 담당한다.

$source = @'
using System;
using System.Runtime.InteropServices;

public class KbBlocker
{
    const int WH_KEYBOARD_LL = 13;
    delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);
    static LowLevelKeyboardProc _proc;
    static IntPtr _hook = IntPtr.Zero;
    static uint _targetPid;

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);
    [DllImport("user32.dll", SetLastError = true)]
    static extern bool UnhookWindowsHookEx(IntPtr hhk);
    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern IntPtr GetModuleHandle(string lpModuleName);
    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);

    [StructLayout(LayoutKind.Sequential)]
    public struct MSG { public IntPtr hwnd; public uint message; public IntPtr wParam; public IntPtr lParam; public uint time; public int x; public int y; }
    [DllImport("user32.dll")]
    static extern int GetMessage(out MSG msg, IntPtr hWnd, uint min, uint max);

    static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0)
        {
            uint pid;
            GetWindowThreadProcessId(GetForegroundWindow(), out pid);
            if (pid == _targetPid)
                return (IntPtr)1; // 우리 창이 포그라운드 → 삼킴
        }
        return CallNextHookEx(_hook, nCode, wParam, lParam);
    }

    public static void Run(uint targetPid)
    {
        _targetPid = targetPid;
        _proc = HookCallback; // GC 방지를 위해 정적 필드에 보관
        _hook = SetWindowsHookEx(WH_KEYBOARD_LL, _proc, GetModuleHandle(null), 0);
        if (_hook == IntPtr.Zero)
        {
            Console.Error.WriteLine("HOOK_FAILED");
            return;
        }
        Console.Out.WriteLine("HOOK_INSTALLED");
        Console.Out.Flush();
        // LL 훅은 설치 스레드가 메시지를 펌프해야 동작한다.
        MSG msg;
        while (GetMessage(out msg, IntPtr.Zero, 0, 0) > 0) { }
        UnhookWindowsHookEx(_hook);
    }
}
'@

Add-Type -TypeDefinition $source -Language CSharp
[KbBlocker]::Run([uint32]$TargetPid)
