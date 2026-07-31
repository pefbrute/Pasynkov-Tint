#!/usr/bin/env python3
import subprocess

def diagnose_favorites():
    print("==========================================================")
    print("DIAGNOSING FAVORITES NOT DISPLAYING IN DOCK")
    print("==========================================================")

    # 1. Fetch errors or warnings in gnome-shell log over the last 1 hour
    cmd = ["journalctl", "--since", "2 hours ago", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    dock_logs = [l for l in logs if "RightDock" in l or "AppFavorites" in l or "syncApps" in l or "favorite" in l.lower()]
    error_logs = [l for l in dock_logs if "ERROR" in l or "WARN" in l or "exception" in l.lower() or "failed" in l.lower()]

    print(f"Total dock-related log lines in last 2 hours: {len(dock_logs)}")
    print(f"Total error/warning lines in last 2 hours: {len(error_logs)}\n")

    print("=== RECENT ERROR / WARNING LOGS ===")
    for l in error_logs[-30:]:
        print("  ", l)

    print("\n=== RECENT DOCK SYNC LOGS (LAST 25 LINES) ===")
    for l in dock_logs[-25:]:
        print("  ", l)

    print("==========================================================")

if __name__ == "__main__":
    diagnose_favorites()
