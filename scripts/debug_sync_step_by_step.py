#!/usr/bin/env python3
import subprocess

def debug_steps():
    print("=== DEBUGGING SYNC APPS STEP BY STEP ===")
    cmd = ["journalctl", "-n", "100", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    step_logs = [l for l in logs if "SYNC STEP" in l or "RightDock" in l or "ERROR" in l]

    for l in step_logs[-30:]:
        print("  ", l)

if __name__ == "__main__":
    debug_steps()
