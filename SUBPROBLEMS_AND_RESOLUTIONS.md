# 📑 RightDock Subproblems & Technical Resolutions Index

This document tracks all fine-grained sub-problems, empirical log findings, and exact code resolutions across `right-dock@pasynkov`.

---

## 📌 Subproblem Index

### 1. SUBPROBLEM-01: Preview Popup Hover Storm Interception (Group C2 Click Loss)
- **Log Evidence:** 7 consecutive `showWindowPreviews` calls within 1 second for 7 separate windows.
- **Mechanism:** Mouse movement generated independent hover timers. Popup overlays spawned directly over icon bounds, capturing pointer press before `DockAppIcon` received `button-press`.
- **Resolution:**
  - Single dock-wide `_scheduleWindowPreview` with a 350ms delay timer and `_previewToken` guard.
  - Positioned popup with a strict 12px left gap (`posX = stageX - popupW - 12`).

---

### 2. SUBPROBLEM-02: Stale Array Index Mutation in `_syncApps()`
- **Log Evidence:** Logs showing `Repositioning icon for pasynkov-connect.desktop from index 15 to 13` / `window:168 from index 13 to 14`.
- **Mechanism:** `currentChildren = this._appsBox.get_children()` was cached once before the loop. Calling `set_child_at_index()` mutated the container's live child list, causing subsequent loop iterations to evaluate against stale indices.
- **Resolution:** Replaced static array snapshot with live `this._appsBox.get_child_at_index(expectedIndex)` check on every iteration.

---

### 3. SUBPROBLEM-03: Transient Empty `AppFavorites` Array Wiping Dock Layout
- **Log Evidence:** `_syncApps()` running at 01:15:11 during GSettings update.
- **Mechanism:** `AppFavorites.getAppFavorites().getFavorites()` returned `[]` transiently. `_syncApps()` evaluated `!addedSet.has(appId)` for all 11 favorites and executed `item.destroy()`.
- **Resolution:** Added a protective guard: if `favs` returns `[]` while existing favorite icons (`existingFavCount > 0`) are present in `_appIconMap`, `_syncApps()` retains existing favorite icons.

---

### 4. SUBPROBLEM-04: Custom App Desktop IDs Returning Null in Fallback Lookup
- **Log Evidence:** Favorites list empty at extension reload when `AppFavorites` was uninitialized.
- **Mechanism:** `Shell.AppSystem.lookup_app(id)` returns `null` for user-installed or custom `.desktop` IDs (like `antigravity.desktop`, `hiddify-root.desktop`, `antigravity-ide.desktop`). Filtering out `null` resulted in an empty `favs` array.
- **Resolution:** Enhanced fallback to use `Shell.App.new_for_desktop_id(id)` when `lookup_app(id)` returns `null`:
```javascript
favs = favIds.map(id => {
    if (!id) return null;
    let app = appSys ? appSys.lookup_app(id) : null;
    if (!app && typeof Shell.App.new_for_desktop_id === 'function') {
        try { app = Shell.App.new_for_desktop_id(id); } catch (_) {}
    }
    return app;
}).filter(app => app !== null && app !== undefined);
```

---

### 5. SUBPROBLEM-05: Scene Graph Reparenting During Pointer Interactions
- **Log Evidence:** 10 consecutive `_syncApps()` calls at 01:18:00 while interacting with the dock.
- **Mechanism:** `set_child_at_index()` detached/re-parented child actors under the cursor during hover or press, invalidating Clutter's pointer picking target sequence.
- **Resolution:** Added deferred sync guard (`_syncPending = true`) in `_syncApps()` when `_pointerInteractionActive` or `_isDraggingIcon` is true. `_setPointerInteractionActive(false)` schedules deferred sync via `GLib.idle_add`.

---

### 6. SUBPROBLEM-06: Container Index Mismatch for `_appGridBtn` and `_appsSeparator`
- **Log Evidence:** Icons disappearing when `_appGridBtn` parent reference became detached.
- **Mechanism:** `if (!this._appGridBtn)` skipped re-inserting `_appGridBtn` into `_appsBox` if `_appGridBtn` instance already existed, leaving `_appsBox` children at index 0 and 1 empty.
- **Resolution:** Explicitly verify `_appGridBtn.get_parent() === _appsBox` and `_appsSeparator.get_parent() === _appsBox` on every `_syncApps()` pass, inserting them at indices 0 and 1.

---

### 7. SUBPROBLEM-07: Invalid `get_child_at_index()` Method Call on `St.BoxLayout` Container
- **Log Evidence:** `_syncApps()` terminating before log audit evaluation.
- **Mechanism:** `St.BoxLayout` does not expose `get_child_at_index(index)` as a native GJS method. Calling it caused evaluation errors during child position checks.
- **Resolution:** Replaced `get_child_at_index(index)` with native GJS child array indexing `this._appsBox.get_children()[expectedIndex]`.
