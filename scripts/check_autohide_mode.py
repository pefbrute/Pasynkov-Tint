#!/usr/bin/env python3
import subprocess

def check_autohide():
    print("=== CHECKING DOCK AUTOHIDE SETTINGS ===")
    res_mode = subprocess.run(["gsettings", "get", "org.gnome.shell.extensions.right-dock", "autohide-mode"], capture_output=True, text=True)
    res_margin = subprocess.run(["gsettings", "get", "org.gnome.shell.extensions.right-dock", "dock-margin"], capture_output=True, text=True)
    print("autohide-mode (0=Always Show, 1=Autohide, 2=Intellihide):", res_mode.stdout.strip())
    print("dock-margin:", res_margin.stdout.strip())

if __name__ == "__main__":
    check_autohide()
