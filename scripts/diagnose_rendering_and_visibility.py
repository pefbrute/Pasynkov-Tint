#!/usr/bin/env python3
import subprocess

def inspect_rendering():
    print("==========================================================")
    print("INSPECTING DOCK RENDERING AND STYLES IN JOURNALCTL")
    print("==========================================================")

    cmd = ["journalctl", "-n", "100", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    dock_logs = [l for l in logs if "RightDock" in l or "create_icon_texture" in l or "St" in l or "icon" in l.lower()]

    print(f"Total matching rendering logs: {len(dock_logs)}\n")
    for l in dock_logs[-30:]:
        print("  ", l)

    print("==========================================================")

if __name__ == "__main__":
    inspect_rendering()
