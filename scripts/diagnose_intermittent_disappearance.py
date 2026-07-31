#!/usr/bin/env python3
import subprocess

def inspect_intermittent():
    print("==========================================================")
    print("      DIAGNOSING INTERMITTENT DISAPPEARANCE & PANEL ISSUE  ")
    print("==========================================================")

    cmd = ["journalctl", "--since", "5 minutes ago", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    print(f"Total log lines in last 5 minutes: {len(logs)}\n")

    # Filter events, warnings, sync audits
    events = [l for l in logs if any(k in l for k in ["RightDock", "SYNC", "Stole", "ERROR", "warning", "Warning", "panel"])]

    print("=== CHRONOLOGICAL RECENT EXTENSION LOGS ===")
    for l in events[-50:]:
        print("  ", l)

    print("==========================================================")

if __name__ == "__main__":
    inspect_intermittent()
