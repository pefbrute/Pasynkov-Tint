# БАГ 6 — Фильтр слетает при смене фокуса на Telegram (РЕШЕНО через Per-Window)

> **Статус:** РЕШЕНО.  
> **Фикс Telegram:** Подтверждён пользователем! В Telegram фильтр больше не слетает при открытии каналов.

---

## 1. Исходная проблема (на `Main.uiGroup`)

Включён любой пресет. Открываешь Telegram Desktop (Qt 6 / 5.15), нажимаешь на канал — фильтр **мгновенно пропадает**. При переключении на другое окно — возвращается.

### Логи в момент сбоя:
```
gnome-shell: Failed to create offscreen effect framebuffer:
             Failed to create texture 2d due to size/format constraints
```

### Причина:
`Clutter.OffscreenEffect` на `Main.uiGroup` создавал полноэкранную offscreen-текстуру. При обновлении Wayland-поверхностей Telegram Mutter временно не мог выделить полноэкранный FBO и прекращал рендер эффекта.

---

## 2. Решение: Per-Window архитектура

Перенесли `Shell.GLSLEffect` с глобального `Main.uiGroup` на каждый `MetaWindowActor` отдельно + `Main.panel` + `_backgroundGroup`.

- **Результат:** Текстура каждого окна небольшая (только размер этого окна) → GPU allocation **никогда не падает**, Telegram работает идеально!

---

## 3. Возникавшие побочные эффекты и их решение

### ✅ Баг 7: Окна скрывались (исправлено)
- **Причина:** GLSL-ошибка `u_intensity redeclared` при создании нескольких экземпляров эффекта.
- **Решение:** Обернули определение uniform в `#ifndef PASYNKOV_TINT_UNIFORMS`.

### 🟡 Баг 8: Overview (Super/Win) и `right-dock`
- **Overview:** ✅ **ИСПРАВЛЕНО.** Прикрепление к `Main.overview._overview` / `_controls` полностью заработало.
- **`right-dock` / Сторонние доки:** 🟡 **В ПРОЦЕССЕ.** Причина: итерация по `_chrome` требовала доступа к полю `_trackedActors` (массив акторов `LayoutManager.Chrome`). Решение внесено в `effectManager.js`.
