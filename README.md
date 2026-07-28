# Pasynkov Tint

> GNOME Shell extension for applying customizable desktop-wide color filters and tints.

**UUID:** `pasynkov-tint@fedor-pasynkov.ru`  
**Target Platform:** Ubuntu 24.04 LTS / GNOME Shell 46 / Wayland  
**Version:** 0.1.0 MVP  

---

## 🌟 Overview

**Pasynkov Tint** allows users to rapidly change desktop visual perception by applying full-screen color filters (Amber, Green, Cyan, Sepia, Grayscale) with smooth intensity adjustment via the top bar panel indicator or mouse wheel scrolling.

### Key Features

- 🎨 **Preset Filters:** Off, Amber, Green, Cyan, Sepia, and Grayscale (Monochrome).
- 🎛️ **Mouse Wheel Control:** Scroll over the top bar icon to dynamically change filter intensity by ±5%.
- 🖥️ **Desktop OSD:** Displays real-time on-screen notification feedback (`Pasynkov Tint · Amber · 65%`).
- ⚡ **Zero CPU Overhead:** Built using GPU-accelerated GLSL `Clutter.ShaderEffect` shaders attached to GNOME Shell's root scene graph (`Main.uiGroup`).
- 💾 **Persistent Settings:** Preserves user preferences and filter intensity across sessions via GSettings.
- ⚙️ **Libadwaita Preferences Dialog:** Full settings window built with GTK4 / Libadwaita (`prefs.js`).

---

## 🚀 Installation & Local Setup

To install Pasynkov Tint locally in your user environment:

1. **Create target extension directory:**

   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions/pasynkov-tint@fedor-pasynkov.ru
   ```

2. **Copy extension files:**

   ```bash
   cp -r * ~/.local/share/gnome-shell/extensions/pasynkov-tint@fedor-pasynkov.ru/
   ```

3. **Compile GSettings schemas:**

   ```bash
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/pasynkov-tint@fedor-pasynkov.ru/schemas/
   ```

4. **Enable extension:**

   ```bash
   gnome-extensions enable pasynkov-tint@fedor-pasynkov.ru
   ```

*(On Wayland, log out and log back in or restart GNOME Shell to reload newly registered extensions).*

---

## 🛠️ Useful Management Commands

- **Enable extension:**
  ```bash
  gnome-extensions enable pasynkov-tint@fedor-pasynkov.ru
  ```

- **Disable extension:**
  ```bash
  gnome-extensions disable pasynkov-tint@fedor-pasynkov.ru
  ```

- **Open Preferences Window:**
  ```bash
  gnome-extensions prefs pasynkov-tint@fedor-pasynkov.ru
  ```

- **View GNOME Shell Live Journal Logs:**
  ```bash
  journalctl --user -f -o cat /usr/bin/gnome-shell | grep "Pasynkov Tint"
  ```

---

## 🗑️ Cleanup & Uninstallation

To remove Pasynkov Tint cleanly:

```bash
gnome-extensions disable pasynkov-tint@fedor-pasynkov.ru
rm -rf ~/.local/share/gnome-shell/extensions/pasynkov-tint@fedor-pasynkov.ru
```

---

## 🙏 Acknowledgements & License

Pasynkov Tint was inspired by the *Tint All* GNOME Shell extension by Amaro Vita.  
Released under the **GNU General Public License v3.0 or later (GPL-3.0-or-later)**.
