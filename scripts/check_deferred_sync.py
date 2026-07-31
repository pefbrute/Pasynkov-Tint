#!/usr/bin/env python3
import subprocess

def check_deferred():
    print("=== CHECKING FOR DEFERRED SYNC LOGS IN JOURNALCTL ===")
    cmd = ["journalctl", "--since", "10 minutes ago", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    def_logs = [l for l in logs if "Deferring _syncApps" in l or "pointer interaction" in l]

    print(f"Total matching deferred sync log lines: {len(def_logs)}\n")
    for l in def_logs[-15:]:
        print("  ", l)

if __name__ == "__main__":
    check_deferred()
