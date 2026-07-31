#!/usr/bin/env python3
import subprocess

def diagnose_clicks_now():
    print("==========================================================")
    print("RIGHT NOW DIAGNOSTIC: CLICK LOSS ANALYSIS (01:18)")
    print("==========================================================")

    cmd = ["journalctl", "--since", "2 minutes ago", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    dock_logs = [l for l in logs if "RightDock" in l or "vfunc_clicked" in l or "button-press" in l or "button-release" in l]

    print(f"Total dock event lines in last 2 minutes: {len(dock_logs)}\n")
    print("=== CHRONOLOGICAL LOGS OF THE LAST 2 MINUTES ===")
    for l in dock_logs:
        print("  ", l)

    print("==========================================================")

if __name__ == "__main__":
    diagnose_clicks_now()
