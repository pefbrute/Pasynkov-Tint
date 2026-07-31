#!/usr/bin/env python3
import subprocess

def inspect_dock_visibility():
    print("==========================================================")
    print("INSPECTING DOCK VISIBILITY & INTELLIHIDE LOGS")
    print("==========================================================")

    cmd = ["journalctl", "-n", "100", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    dock_logs = [l for l in logs if "RightDock" in l or "intellihide" in l.lower() or "hideDock" in l or "showDock" in l]

    print(f"Total matching dock visibility logs: {len(dock_logs)}\n")
    for l in dock_logs[-30:]:
        print("  ", l)

    print("==========================================================")

if __name__ == "__main__":
    inspect_dock_visibility()
