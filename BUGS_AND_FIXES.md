# Pasynkov Tint — Known Issues & Fixes Log

Chronological technical log of issues encountered during development, root cause analysis, and implemented solutions.

---

## ✅ ISSUE 1 — `Adw.SwitchRow is not a constructor`

**Trigger:** Opening extension preferences dialog (Extension Manager → ⚙).

**Error:**
```text
TypeError: Adw.SwitchRow is not a constructor
  fillPreferencesWindow @ prefs.js:33
```

**Root Cause:**  
`Adw.SwitchRow` was introduced in libadwaita 1.4 (GNOME 45+). On GNOME 44 and earlier, the class does not exist and direct instantiation with `new Adw.SwitchRow()` throws a TypeError.

**Solution:**  
Implemented a compatibility factory helper:
```javascript
function _makeSwitchRow(title, subtitle, settings, key) {
    if (typeof Adw.SwitchRow === 'function') {
        // GNOME 45+ (libadwaita 1.4+)
        const row = new Adw.SwitchRow({ title, subtitle });
        settings.bind(key, row, 'active', Gio.SettingsBindFlags.DEFAULT);
        return row;
    }
    // Fallback: ActionRow + Gtk.Switch suffix
    const row    = new Adw.ActionRow({ title, subtitle });
    const toggle = new Gtk.Switch({ valign: Gtk.Align.CENTER });
    settings.bind(key, toggle, 'active', Gio.SettingsBindFlags.DEFAULT);
    row.add_suffix(toggle);
    row.activatable_widget = toggle;
    return row;
}
```

**File:** [`prefs.js`](./prefs.js)

---

## ✅ ISSUE 2 — `gettext() used without calling initTranslations() first`

**Trigger:** Loading extension in GNOME Shell.

**Error:**
```text
gettext() is used without calling initTranslations() first
```

**Root Cause:**  
`ExtensionUtils.gettext()` was invoked before `initTranslations()`. In GNOME 45+, GNOME Shell automatically invokes `initTranslations()` before calling `fillPreferencesWindow()`. Manual calls in `init()` cause duplicate initialization warnings.

**Solution:**
- Removed manual `ExtensionUtils.initTranslations()` from `prefs.js → init()`.
- Wrapped `gettext` calls in a safe try-catch wrapper with string fallback:
```javascript
function _(s) {
    try { return ExtensionUtils.gettext(s); }
    catch (_) { return s; }
}
```

**Files:** [`prefs.js`](./prefs.js), [`lib/indicator.js`](./lib/indicator.js)

---

## ✅ ISSUE 3 — Screen turns completely gray after enabling (Emergency Recovery)

**Trigger:** Initial prototype using custom `Clutter.ShaderEffect`.

**Symptom:**  
Enabling the filter resulted in a solid gray screen obscuring the desktop except for the mouse cursor.

**Root Cause:**  
Initial prototype with raw `Clutter.ShaderEffect` replaced the rendering pipeline output without proper texture sampling coordinates or alpha channel pass-through.

**Solution:**  
Switched to single-pass `Shell.GLSLEffect` utilizing snippet hooks on fragment shaders (`add_glsl_snippet(Shell.SnippetHook.FRAGMENT, ...)`).

---

## ✅ ISSUE 4 — Offscreen Framebuffer Drop in Telegram Desktop on Wayland

**Trigger:** Opening Telegram Desktop or playing media in Qt 6 applications.

**Symptom:**  
Filter silently turned off for the entire screen when focusing Telegram or media windows.

**Root Cause:**  
Attaching offscreen effects directly to `Main.uiGroup` requires multi-monitor full-screen GPU textures. Qt Wayland sub-surface updates trigger damage recalculations that cause Cogl texture allocations to fail (`cogl_texture_2d_new_with_size` returns `NULL`).

**Solution:**  
Redesigned architecture to per-actor single-pass GLSL engine (`_syncWindowActors()`, `_syncChromeActors()`).

---

## ✅ ISSUE 5 — Dynamic GSettings Schema Compilation

**Trigger:** Reading settings key before compiling XML schema.

**Solution:**  
Added `glib-compile-schemas` build step and automated verification script.

---

## ✅ ISSUE 6 — Icon Path Resolution Across GNOME Shell Versions

**Trigger:** Icon failing to render in top bar on GNOME 45+.

**Root Cause:**  
In GNOME 45+, `ExtensionUtils.getCurrentExtension()` path metadata changed format.

**Solution:**  
Added robust path fallback `const path = Me.path || extension.path || '';`.

---

## ✅ ISSUE 7 — GLSL Uniform Redeclaration Link Error

**Trigger:** Creating multiple `Shell.GLSLEffect` instances across windows.

**Error:**
```text
Cogl fragment shader compilation error: u_intensity redeclared
```

**Root Cause:**  
Cogl concatenates fragment shader declarations when multiple shader effects exist in the pipeline.

**Solution:**  
Wrapped uniform declarations in `#ifndef PASYNKOV_TINT_UNIFORMS` preprocessor guards.

---

## ✅ ISSUE 8 — Alt+Tab Switcher & Dock Coverage

**Trigger:** Pressing Alt+Tab or hovering over side docks.

**Symptom:**  
Alt+Tab popup switcher list displayed in unfiltered color.

**Solution:**  
Expanded `_getChromeActors()` to inspect `Main.layoutManager._trackedActors`, `uiGroup`, and `modalDialogGroup` for `switcher-popup` and dock containers.

---

## ✅ ISSUE 9 — System Lag & Invisible Hover Zone Blockage

**Trigger:** Attaching offscreen effects to invisible UI elements.

**Symptom:**  
Desktop experienced lag, and `right-dock` stopped sliding out on edge hover.

**Root Cause:**  
`right-dock-hover-zone` is an invisible touch zone with `width = 0`. Attaching offscreen effects to 0-sized actors caused 60 Cogl assertion failures per second (`width > 0 && height > 0` failed).

**Solution:**  
Added `_isEligibleActor(actor)` helper checking `get_transformed_size() >= 2px`, `opacity > 0`, and filtering out `hover-zone` elements.

---

## ✅ ISSUE 10 — Intensity Slider Not Updating Active Effects

**Trigger:** Moving intensity slider or scrolling mouse wheel on top bar icon.

**Symptom:**  
Menu label updated percentage, but active windows didn't update visual tint strength.

**Root Cause:**  
`enableEffect()` updated internal intensity variable but skipped calling `_refreshAll()` for already-attached effects.

**Solution:**  
Added `this._refreshAll()` call inside `enableEffect()` to immediately upload updated `u_intensity` uniforms via `set_uniform_float`.

---

## Quick Reference

### Extension Architecture
```text
extension.js          — Lifecycle management (enable/disable), settings bindings
lib/effectManager.js  — Per-actor GLSL shader manager & watchdog
lib/indicator.js      — Top bar panel menu, scroll handler, OSD
lib/presets.js        — Preset definitions (Amber, Green, Cyan, Sepia, Grayscale)
prefs.js              — Preferences GTK4 + Libadwaita window
schemas/              — GSettings XML schema & compiled binary
```
