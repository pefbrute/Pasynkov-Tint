#!/usr/bin/env python3
import subprocess

def analyze_timeline():
    print("=== DOCK TIMELINE INTERLEAVING ANALYSIS ===")
    cmd = ["journalctl", "-n", "1000", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    click_and_preview_lines = [
        line for line in logs 
        if "RightDock" in line and any(k in line for k in ["button-press", "clicked", "ACTIVATE", "showWindowPreviews", "SYNC"])
    ]

    print(f"Total matching timeline events: {len(click_and_preview_lines)}\n")
    print("Last 25 timeline events in chronological order:")
    for line in click_and_preview_lines[-25:]:
        parts = line.split("gnome-shell[")
        ts = parts[0].strip()
        msg = parts[1].split("]: ")[1] if len(parts) > 1 else line
        print(f"  [{ts}] {msg}")

if __name__ == "__main__":
    analyze_timeline()
