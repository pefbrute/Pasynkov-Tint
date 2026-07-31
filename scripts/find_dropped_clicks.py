#!/usr/bin/env python3
import subprocess

def find_dropped_clicks():
    print("=== SEARCHING FOR MISSED OR DROPPED CLICKS ===")
    cmd = ["journalctl", "-n", "3000", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    presses = []
    clicks = []

    for idx, line in enumerate(logs):
        if "RightDock" in line:
            if "button-press" in line:
                presses.append((idx, line))
            elif "clicked" in line:
                clicks.append((idx, line))

    print(f"Total recorded button-presses: {len(presses)}")
    print(f"Total recorded clicked events: {len(clicks)}\n")

    unmatched_presses = []
    for p_idx, p_line in presses:
        matched = False
        for c_idx, c_line in clicks:
            if 0 <= c_idx - p_idx <= 10:
                matched = True
                break
        if not matched:
            unmatched_presses.append(p_line)

    if unmatched_presses:
        print(f"FOUND {len(unmatched_presses)} UNMATCHED button-press events (Press without Click):")
        for line in unmatched_presses:
            print("  [UNMATCHED]", line)
    else:
        print("All recorded button-press events resulted in a clicked signal.")

if __name__ == "__main__":
    find_dropped_clicks()
