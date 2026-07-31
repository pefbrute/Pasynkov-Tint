#!/usr/bin/env python3
import subprocess

def read_live_children():
    print("==========================================================")
    print("READING LIVE APPSBOX CHILDREN LOG FROM JOURNALCTL")
    print("==========================================================")

    cmd = ["journalctl", "-n", "80", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    live_logs = [l for l in logs if "SYNC LIVE CHILDREN" in l or "SYNC AUDIT" in l or "ERROR" in l]

    print(f"Total matching live children logs: {len(live_logs)}\n")
    for l in live_logs:
        print("  ", l)

    print("==========================================================")

if __name__ == "__main__":
    read_live_children()
