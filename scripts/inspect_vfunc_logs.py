#!/usr/bin/env python3
import subprocess

def inspect_vfunc():
    print("==========================================================")
    print("INSPECTING VFUNC_CLICKED & BUTTON LOGS IN LAST 2 MINUTES")
    print("==========================================================")

    cmd = ["journalctl", "--since", "2 minutes ago", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    vfunc_logs = [l for l in logs if "RightDock" in l or "vfunc_clicked" in l or "button-press" in l or "button-release" in l]

    print(f"Total matching event logs: {len(vfunc_logs)}\n")
    for l in vfunc_logs[-30:]:
        print("  ", l)

    print("==========================================================")

if __name__ == "__main__":
    inspect_vfunc()
