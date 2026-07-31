#!/usr/bin/env python3
import subprocess

def inspect_exact_window():
    print("=== INSPECTING ALL GNOME SHELL LOGS FROM 01:15:00 TO NOW ===")
    cmd = ["journalctl", "--since", "01:15:00", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    for l in logs:
        print("  ", l)

if __name__ == "__main__":
    inspect_exact_window()
