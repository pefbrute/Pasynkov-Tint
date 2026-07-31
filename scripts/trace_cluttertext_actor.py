#!/usr/bin/env python3
import subprocess

def trace_actor():
    print("=== TRACING CLUTTERTEXT ACTOR MARKUP ERROR IN JOURNALCTL ===")
    cmd = ["journalctl", "--since", "5 minutes ago", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    for i, l in enumerate(logs):
        if "Failed to set the markup" in l:
            print("FOUND MARKUP ERROR:")
            for j in range(max(0, i - 5), min(len(logs), i + 6)):
                print(f"  [{j}] {logs[j]}")

if __name__ == "__main__":
    trace_actor()
