# 🧪 RightDock Architecture Redesign & Rewrite Plan

> **DECISION:** Refactor `DockAppIcon` from scratch on top of GNOME Shell's native `AppDisplay.AppIcon`.  
> **GOAL:** Eliminate overlapping custom event handlers, manual pointer grabs, and state collisions by leveraging GNOME Shell's native button & DND implementation.

---

## 🏗 Decoupled Architecture Design

```text
AppModel
  └── App list, window references, state tracking

DockView
  └── Layout container for persistent actors (uses set_child_at_index)

DockAppIcon (extends AppDisplay.AppIcon)
  └── Native GNOME press/release/clicked, pointer grabs, DND threshold, fake_release()

PreviewController
  └── Non-reactive window preview popups

VisibilityController
  └── Autohide & intellihide (frozen during pointer interactions)

DndController
  └── Isolated favorite reordering
```

---

## 📋 Staged Rewrite Plan

1. **Step 1: Minimal Dock Core**
   - Subclass `AppDisplay.AppIcon`.
   - Implement basic vertical layout & native click activation.
2. **Step 2: 200-Click Verification Pass**
   - Run diagnostic scripts to verify 0 dropped clicks across 200 consecutive clicks.
3. **Step 3: Connect Native DND**
   - Enable `DND.makeDraggable` with native drag threshold.
4. **Step 4: Running Dots & Window Count**
   - Add vertical running dots without re-triggering `_syncApps()`.
5. **Step 5: Preview Controller**
   - Add non-reactive window preview popups.
6. **Step 6: Visibility Controller**
   - Add autohide with `remove_all_transitions()` freeze during interaction.

---

## 🚫 Structural Sync Rules

`windows-changed` **MUST NOT** trigger structural `_syncApps()`.  
Structural sync runs **ONLY** on:
- `AppFavorites` changes.
- App state transitions (`STOPPED` $\leftrightarrow$ `RUNNING`).
- App addition or deletion from dock list.
