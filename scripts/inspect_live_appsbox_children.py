#!/usr/bin/env python3
import subprocess

def inspect_children():
    print("=== INSPECTING RECENT APPSBOX LOGS ===")
    cmd = ["journalctl", "-n", "80", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    for l in logs:
        if any(k in l for k in ["RightDock", "Repositioning", "syncApps"]):
            print("  ", l)

if __name__ == "__main__":
    inspect_children()
