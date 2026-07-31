#!/usr/bin/env python3
import subprocess

def read_0134():
    print("=== READING ALL JOURNALCTL LOGS FOR LAST 2 MINUTES ===")
    cmd = ["journalctl", "--since", "2 minutes ago", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    for l in logs:
        print("  ", l)

if __name__ == "__main__":
    read_0134()
