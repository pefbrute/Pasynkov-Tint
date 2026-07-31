#!/usr/bin/env python3
import subprocess

def inspect_recent_clicks():
    print("==========================================================")
    print("      LIVE CLICK EVENTS DIAGNOSIS IN JOURNALCTL (02:19)   ")
    print("==========================================================")

    cmd = ["journalctl", "--since", "3 minutes ago", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    click_logs = [l for l in logs if any(k in l for k in ["EVENT", "ACTIVATE", "button-press", "button-release", "vfunc_clicked", "activateOrMinimize"])]

    print(f"Total click-related log lines in last 3 minutes: {len(click_logs)}\n")
    for l in click_logs[-30:]:
        print("  ", l)

    print("==========================================================")

if __name__ == "__main__":
    inspect_recent_clicks()
