#!/usr/bin/env python3
import subprocess

def test_clutter_api():
    print("=== TESTING ST.BOXLAYOUT METHOD IN JOURNALCTL ===")
    cmd = ["journalctl", "-n", "100", "--no-pager", "/usr/bin/gnome-shell"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logs = res.stdout.splitlines()

    gjs_errs = [l for l in logs if "get_child_at_index" in l or "get_n_children" in l or "TypeError" in l or "is not a function" in l]

    print(f"Total matching GJS function errors: {len(gjs_errs)}\n")
    for l in gjs_errs:
        print("  ", l)

if __name__ == "__main__":
    test_clutter_api()
