#!/usr/bin/env python3
import subprocess

def check_insert_error():
    print("=== CHECKING FOR insert_child_at_index ERROR IN JOURNALCTL ===")
    cmd = ["journalctl", "-n", "100", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    errs = [l for l in logs if "insert_child" in l or "TypeError" in l or "Stack:" in l or "ERROR" in l]

    print(f"Total matching error lines: {len(errs)}\n")
    for l in errs:
        print("  ", l)

if __name__ == "__main__":
    check_insert_error()
