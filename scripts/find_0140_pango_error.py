#!/usr/bin/env python3
import subprocess

def find_0140_pango():
    print("=== FINDING EXACT PANGO ERROR LOG CONTEXT AT 01:40:40 ===")
    cmd = ["journalctl", "--since", "01:40:00", "--until", "01:41:00", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    for l in logs:
        print("  ", l)

if __name__ == "__main__":
    find_0140_pango()
