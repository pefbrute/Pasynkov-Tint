# БАГ 6 — Фильтр слетает при смене фокуса на Telegram и проблемы реализации

> **Статус:** В процессе решения.  
> **Приоритет:** Высокий.

---

## 1. Исходная проблема (на `Main.uiGroup`)

Включён любой пресет. Открываешь Telegram Desktop (написан на **Qt 6 / 5.15**), нажимаешь на канал — фильтр **мгновенно пропадает**. При переключении на другое окно — возвращается.

### Логи в момент сбоя:
```
gnome-shell: Failed to create offscreen effect framebuffer:
             Failed to create texture 2d due to size/format constraints
```

### Причина:
`Clutter.DesaturateEffect` и `Clutter.BrightnessContrastEffect` на `Main.uiGroup` создают полноэкранные offscreen-текстуры. При обновлении Wayland-поверхностей Telegram Mutter временно не может выделить полноэкранный FBO и прекращает рендер эффекта (при этом `get_effect()` продолжает возвращать объект эффекта).

---

## 2. Попытка решения через per-window (и появление БАГА 7: скрытие окон)

### Что сделано:
Перенесли `Shell.GLSLEffect` с глобального `Main.uiGroup` на каждый `MetaWindowActor` отдельно + `Main.panel` + `_backgroundGroup`.

### Что произошло (Симптом):
При включении фильтра **все окна становятся невидимыми (скрываются)**!

### Логи при включении per-window эффекта:
```
Failed to link GLSL program:
error: `u_intensity' redeclared
error: `u_desat' redeclared
error: `u_tint' redeclared
error: `u_tint_mix' redeclared
error: linking with uncompiled/unspecialized shader
```

### Причина скрытия окон:
При создании множества экземпляров `PasynkovTintEffect` (по одному на каждое окно) метод `add_glsl_snippet` регистрировал объявление `uniform float u_intensity;` в общей программе Cogl. Из-за повторных объявлений в GLSL возникала ошибка линковки шейдера (`redeclared`). Когда GLSL-программа не линкуется, Cogl рендерит прозрачную/пустую текстуру для актора окна — в результате окно полностью исчезает с экрана!

---

## 3. Решение проблемы с GLSL (в процессе проверки)

1. **Защита от повторного объявления (GLSL Guard):**
   Обернуть объявления uniform в `#ifndef PASYNKOV_TINT_UNIFORMS`:
   ```glsl
   #ifndef PASYNKOV_TINT_UNIFORMS
   #define PASYNKOV_TINT_UNIFORMS
   uniform float u_intensity;
   uniform float u_desat;
   uniform vec3  u_tint;
   uniform float u_tint_mix;
   #endif
   ```
2. **Передача единого экземпляра / правильная параметризация шейдеров для per-window.**

---

## Ссылки и история
- [Telegram Desktop (Qt)](https://github.com/telegramdesktop/tdesktop)
- [Mutter Clutter.OffscreenEffect Docs](https://mutter.gnome.org/clutter/class.OffscreenEffect.html)
