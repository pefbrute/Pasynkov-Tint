#!/usr/bin/env python3
import subprocess

def trace_markup_origin():
    print("=== TRACING EXACT ORIGIN OF PANGO MARKUP ERROR AT 02:10:51 ===")
    cmd = ["journalctl", "--since", "02:10:00", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    for i, l in enumerate(logs):
        if "Failed to set the markup" in l:
            print("MARKUP ERROR LOG ENTRY:")
            for j in range(max(0, i - 8), min(len(logs), i + 8)):
                print(f"  [{j}] {logs[j]}")

if __name__ == "__main__":
    trace_markup_origin()
