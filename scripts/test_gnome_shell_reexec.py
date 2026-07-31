#!/usr/bin/env python3
import subprocess

def reexec():
    print("=== TESTING GNOME SHELL RE-EXEC VIA DBUS ===")
    cmd = ["busctl", "--user", "call", "org.gnome.Shell", "/org/gnome/Shell", "org.gnome.Shell", "Eval", "s", "global.reexec_self()"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    print("Return code:", res.returncode)
    print("Stdout:", res.stdout)
    print("Stderr:", res.stderr)

if __name__ == "__main__":
    reexec()
