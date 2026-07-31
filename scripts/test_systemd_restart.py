#!/usr/bin/env python3
import subprocess

def test_systemd():
    print("=== TESTING SYSTEMD GNOME-SHELL RESTART STATUS ===")
    res = subprocess.run(["systemctl", "--user", "is-active", "gnome-shell"], capture_output=True, text=True)
    print("Is active:", res.stdout.strip())

    res_status = subprocess.run(["systemctl", "--user", "status", "org.gnome.Shell.desktop"], capture_output=True, text=True)
    print(res_status.stdout[:300])

if __name__ == "__main__":
    test_systemd()
