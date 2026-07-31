#!/usr/bin/env python3
import subprocess

def inspect_sync_details():
    print("==========================================================")
    print("INSPECTING SYNC DETAILS IN JOURNALCTL")
    print("==========================================================")

    cmd = ["journalctl", "-n", "100", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    sync_logs = [l for l in logs if "RightDock" in l or "SYNC" in l or "ERROR" in l or "WARN" in l]

    print(f"Total matching sync logs: {len(sync_logs)}\n")
    for l in sync_logs:
        print("  ", l)

    print("==========================================================")

if __name__ == "__main__":
    inspect_sync_details()
