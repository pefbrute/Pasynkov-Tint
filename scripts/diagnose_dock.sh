#!/usr/bin/env bash
# Diagnostic script to analyze RightDock and GNOME Shell logs and state

echo "=========================================="
echo "GNOME SHELL DOCK DIAGNOSTIC REPORT"
echo "Timestamp: $(date -Iseconds)"
echo "=========================================="

echo -e "\n1. Checking GNOME Shell processes..."
ps aux | grep gnome-shell | grep -v grep

echo -e "\n2. Analyzing recent RightDock events in journalctl (last 100 entries)..."
journalctl -n 200 --no-pager /usr/bin/gnome-shell | grep -iE "RightDock|DockAppIcon|_syncApps|clicked|button-press" | tail -n 40

echo -e "\n3. Checking for Cogl/Clutter errors or FBO warnings..."
journalctl -n 300 --no-pager /usr/bin/gnome-shell | grep -iE "FBO|framebuffer|cogl|clutter|pick|unmap" | tail -n 20

echo -e "\n4. Summary of showWindowPreviews frequency in last 60 seconds..."
journalctl --since "1 minute ago" --no-pager /usr/bin/gnome-shell | grep -c "showWindowPreviews" || echo "0"

echo "=========================================="
