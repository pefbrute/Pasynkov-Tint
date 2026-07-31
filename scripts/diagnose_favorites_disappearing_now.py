#!/usr/bin/env python3
import subprocess

def diagnose_disappearing_now():
    print("==========================================================")
    print("RIGHT NOW DIAGNOSTIC: FAVORITES DISAPPEARED (01:16)")
    print("==========================================================")

    # 1. Fetch journalctl gnome-shell logs for the last 3 minutes
    cmd = ["journalctl", "--since", "3 minutes ago", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    dock_logs = [l for l in logs if "RightDock" in l or "syncApps" in l or "appIconMap" in l or "Repositioning" in l or "WARN" in l or "ERROR" in l]

    print(f"Total matching dock log lines in last 3 minutes: {len(dock_logs)}\n")
    print("=== CHRONOLOGICAL LOGS OF THE LAST 3 MINUTES ===")
    for l in dock_logs:
        print("  ", l)

    print("==========================================================")

if __name__ == "__main__":
    diagnose_disappearing_now()
