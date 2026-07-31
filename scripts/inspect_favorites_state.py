#!/usr/bin/env python3
import subprocess

def inspect_favorites_dconf():
    print("==========================================================")
    print("INSPECTING GNOME FAVORITES DCONF & SHELL LOGS")
    print("==========================================================")

    # 1. Read favorite-apps setting from gsettings / dconf
    cmd = ["gsettings", "get", "org.gnome.shell", "favorite-apps"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    favs = res.stdout.strip()
    print(f"GSettings favorite-apps setting:\n  {favs}\n")

    # 2. Get last 50 gnome-shell log lines containing _syncApps or RightDock
    cmd2 = ["journalctl", "-n", "100", "--no-pager", "/usr/bin/gnome-shell"]
    res2 = subprocess.run(cmd2, capture_output=True, text=True)
    lines = res2.stdout.splitlines()

    sync_lines = [l for l in lines if "RightDock" in l or "syncApps" in l or "repositioning" in l.lower()]
    print("Recent sync & repositioning logs:")
    for l in sync_lines[-20:]:
        print("  ", l)

    print("==========================================================")

if __name__ == "__main__":
    inspect_favorites_dconf()
