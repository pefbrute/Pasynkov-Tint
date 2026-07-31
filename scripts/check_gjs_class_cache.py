#!/usr/bin/env python3
import subprocess

def check_pid_and_logs():
    print("=== GNOME SHELL PID & PROCESS LOG CHECK ===")

    # Get GNOME Shell PID
    res = subprocess.run(["pgrep", "-f", "gnome-shell"], capture_output=True, text=True)
    pids = res.stdout.strip().split()
    print(f"Current GNOME Shell PIDs: {pids}")

    # Check build log or extension initialization log
    cmd = ["journalctl", "-n", "100", "--no-pager", "/usr/bin/gnome-shell"]
    res2 = subprocess.run(cmd, capture_output=True, text=True)
    logs = res2.stdout.splitlines()

    init_logs = [l for l in logs if "RightDock" in l and any(k in l for k in ["init", "enable", "BUILD", "Starting"])]
    print("\nRecent extension lifecycle logs:")
    for l in init_logs[-10:]:
        print("  ", l)

if __name__ == "__main__":
    check_pid_and_logs()
