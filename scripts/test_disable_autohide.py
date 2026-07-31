#!/usr/bin/env python3
import subprocess

def disable_autohide():
    print("=== SETTING DOCK AUTOHIDE-MODE TO 0 (ALWAYS SHOW) ===")
    res = subprocess.run(["gsettings", "set", "org.gnome.shell.extensions.right-dock", "autohide-mode", "0"], capture_output=True, text=True)
    print("Returncode:", res.returncode)

    res_val = subprocess.run(["gsettings", "get", "org.gnome.shell.extensions.right-dock", "autohide-mode"], capture_output=True, text=True)
    print("New autohide-mode value:", res_val.stdout.strip())

if __name__ == "__main__":
    disable_autohide()
