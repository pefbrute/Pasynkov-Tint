#!/usr/bin/env python3
import subprocess
import json

def diagnose_live():
    print("==========================================================")
    print("      DIAGNOSING FAVORITES VISIBILITY IN LIVE GSETTINGS    ")
    print("==========================================================")

    res_fav = subprocess.run(["gsettings", "get", "org.gnome.shell", "favorite-apps"], capture_output=True, text=True)
    print(f"1. GSettings favorite-apps string:\n   {res_fav.stdout.strip()}")

    # Check desktop files existence in system / local share applications
    import glob
    apps_dirs = [
        "/usr/share/applications",
        "/usr/local/share/applications",
        os.path.expanduser("~/.local/share/applications")
    ]

    print("\n2. Checking desktop file locations for favorite IDs:")
    import re
    fav_ids = re.findall(r"'([^']+)'", res_fav.stdout)
    for fid in fav_ids:
        found_paths = []
        for d in apps_dirs:
            p = os.path.join(d, fid)
            if os.path.exists(p):
                found_paths.append(p)
        print(f"  - [{fid}]: {'FOUND in ' + ', '.join(found_paths) if found_paths else 'NOT FOUND IN APPS DIRS ❌'}")

    # Inspect last 60 journalctl lines
    print("\n3. Latest journalctl logs for RightDock SYNC:")
    res_j = subprocess.run(["journalctl", "-n", "40", "--no-pager", "/usr/bin/gnome-shell"], capture_output=True, text=True)
    sync_lines = [l for l in res_j.stdout.splitlines() if "RightDock" in l or "SYNC" in l or "ERROR" in l]
    for l in sync_lines[-20:]:
        print("  ", l)

    print("==========================================================")

if __name__ == "__main__":
    import os
    diagnose_live()
