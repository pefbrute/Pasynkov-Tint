#!/usr/bin/env python3
import subprocess

def read_0137():
    print("=== READING ALL JOURNALCTL LOGS FOR LAST 1 MINUTE ===")
    cmd = ["journalctl", "--since", "1 minute ago", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    for l in logs:
        print("  ", l)

if __name__ == "__main__":
    read_0137()
