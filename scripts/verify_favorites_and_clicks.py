#!/usr/bin/env python3
import subprocess

def verify_all():
    print("==========================================================")
    print("AUTOMATED VERIFICATION: FAVORITES & CLICK AUDIT")
    print("==========================================================")

    # 1. Read gsettings favorite-apps
    cmd1 = ["gsettings", "get", "org.gnome.shell", "favorite-apps"]
    res1 = subprocess.run(cmd1, capture_output=True, text=True)
    fav_list = res1.stdout.strip()
    print(f"GSettings Favorites ({len(fav_list.split(','))} items):\n  {fav_list}\n")

    # 2. Inspect gnome-shell journalctl for _syncApps and creation logs
    cmd2 = ["journalctl", "-n", "100", "--no-pager", "/usr/bin/gnome-shell"]
    res2 = subprocess.run(cmd2, capture_output=True, text=True)
    logs = res2.stdout.splitlines()

    sync_logs = [l for l in logs if "RightDock" in l or "SYNC" in l or "orderedTargetApps" in l or "Fallback" in l]

    print("=== RECENT DOCK SYNC & INITIALIZATION LOGS ===")
    for l in sync_logs[-25:]:
        print("  ", l)

    print("==========================================================")

if __name__ == "__main__":
    verify_all()
