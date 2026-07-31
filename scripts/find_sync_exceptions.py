#!/usr/bin/env python3
import subprocess

def find_exceptions():
    print("=== SEARCHING FOR _syncApps EXCEPTIONS IN JOURNALCTL ===")
    cmd = ["journalctl", "-n", "300", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    err_logs = [l for l in logs if "_syncApps failed" in l or "ERROR" in l or "Stack:" in l or "TypeError" in l or "ReferenceError" in l]

    print(f"Total matching exception logs: {len(err_logs)}\n")
    for l in err_logs:
        print("  ", l)

if __name__ == "__main__":
    find_exceptions()
