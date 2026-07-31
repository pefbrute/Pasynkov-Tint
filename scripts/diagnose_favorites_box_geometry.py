#!/usr/bin/env python3
import subprocess

def inspect_geometry():
    print("==========================================================")
    print("   DIAGNOSING APPSBOX GEOMETRY & VISIBILITY (02:22)       ")
    print("==========================================================")

    cmd = ["journalctl", "-n", "60", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    live_children_logs = [l for l in logs if "SYNC LIVE CHILDREN" in l or "SYNC AUDIT" in l or "HealthCheck" in l or "ERROR" in l]

    print(f"Total matching layout/geometry logs: {len(live_children_logs)}\n")
    for l in live_children_logs:
        print("  ", l)

    print("==========================================================")

if __name__ == "__main__":
    inspect_geometry()
