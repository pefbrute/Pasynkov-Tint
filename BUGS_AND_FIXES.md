# Pasynkov Tint — Баги и их решения

Хронологический журнал проблем, с которыми столкнулись при разработке,
и способов их решения (или текущего статуса).

---

## ✅ БАГ 1 — `Adw.SwitchRow is not a constructor`

**Когда:** При открытии настроек расширения (Extension Manager → ⚙).

**Ошибка:**
```
TypeError: Adw.SwitchRow is not a constructor
  fillPreferencesWindow @ prefs.js:33
```

**Причина:**  
`Adw.SwitchRow` появился только в libadwaita 1.4 (GNOME 45+).  
На GNOME 44 и ниже класс отсутствует, а прямой вызов `new Adw.SwitchRow()`
падает с TypeError.

**Решение:**  
Добавили обёртку-фабрику с проверкой доступности:
```js
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

**Файл:** [`prefs.js`](./prefs.js)

---

## ✅ БАГ 2 — `gettext() used without calling initTranslations() first`

**Когда:** При загрузке расширения в GNOME Shell.

**Ошибка:**
```
gettext() is used without calling initTranslations() first
```

**Причина:**  
В `prefs.js` вызывался `ExtensionUtils.gettext()` до вызова
`initTranslations()`. В GNOME 45+ `initTranslations()` вызывает
**сам шелл** перед `fillPreferencesWindow()` — делать это вручную
в `init()` не нужно и приводит к двойному вызову.

В `extension.js` функция `_()` в `indicator.js` тоже обращалась к gettext
до инициализации.

**Решение:**
- Убрали ручной вызов `ExtensionUtils.initTranslations()` из `prefs.js → init()`.
- Обернули вызов `gettext` в try/catch с fallback:
```js
function _(s) {
    try { return ExtensionUtils.gettext(s); }
    catch (_) { return s; }
}
```

**Файлы:** [`prefs.js`](./prefs.js), [`lib/indicator.js`](./lib/indicator.js)

---

## ✅ БАГ 3 — Серый экран после включения (всё скрыто, только курсор)

**Когда:** Первый запуск расширения с шейдерным подходом.

**Симптом:**  
После включения расширения — полностью серый экран, ничего не видно
кроме курсора мыши. Пришлось переименовать папку расширения в `.disabled`
чтобы вернуть рабочий стол.

**Причина:**  
Первоначальная реализация через `Clutter.ShaderEffect` с GLSL-шейдером
применяла эффект неправильно — шейдер рендерил результат в непрозрачный
серый буфер поверх всего десктопа без корректного сэмплирования исходной
текстуры.

**Решение:**  
Полностью отказались от `ShaderEffect`. Перешли на связку двух стабильных
встроенных эффектов Clutter:

| Эффект | Роль |
|--------|------|
| `Clutter.DesaturateEffect` | Убирает насыщенность (0.0 = цвет, 1.0 = ч/б) |
| `Clutter.BrightnessContrastEffect` | Добавляет цветовой оттенок поверх |

Оба применяются к `Main.uiGroup` — корневому контейнеру GNOME Shell.

Также добавили **кнопку Emergency Reset** в меню (⚠ сбрасывает всё мгновенно).

**Файл:** [`lib/effectManager.js`](./lib/effectManager.js)

---

## ✅ БАГ 4 — Правый клик по иконке не открывал меню

**Когда:** После первой рабочей версии расширения.

**Симптом:**  
Левый клик по иконке работал (переключал пресет).  
Правый клик — ничего не происходило.

**Причина:**  
`PanelMenu.Button` внутри обрабатывает **любой** клик через свой `_onEvent`,
который вызывает `menu.toggle()` **раньше**, чем срабатывает наш обработчик
`button-press-event`. Поэтому:

- Правый клик → родитель открыл меню → наш код вызвал `menu.toggle()` ещё раз → меню сразу закрылось.

**Решение:**  
Удалили ручную обработку правого клика (button === 3) — родительский класс
уже всё делает. Для левого клика (cycle/toggle) после открытия меню родителем
вызываем `this.menu.close()` и выполняем нашу логику:

```js
_onButtonPress(_actor, event) {
    const button = event.get_button();
    const action = this._settings.get_string('click-action');

    if (button === 1) {
        if (action === 'cycle') {
            this.menu.close();          // закрываем то, что открыл родитель
            // ... цикл пресетов
            return Clutter.EVENT_STOP;
        }
        // action === 'menu': родитель уже открыл → ничего не делаем
    }
    // button === 3: родитель уже открыл меню → ничего не делаем
    return Clutter.EVENT_PROPAGATE;
}
```

**Файл:** [`lib/indicator.js`](./lib/indicator.js)

---

## ✅ БАГ 5 — Фильтр не применялся после перезапуска расширения

**Когда:** Включить фильтр → выключить/включить расширение → фильтр не применяется.  
Но стоит сдвинуть слайдер интенсивности — сразу включается.

**Причина:**  
В `_restoreState()` применение настроек было заблокировано двойным условием:

```js
// Было:
if (restoreState && enabled) {   // ← нужны ОБА флага
    this._applyCurrentSettings();
}
```

`restore-state` по умолчанию `false`, поэтому даже при `effect-enabled = true`
фильтр не восстанавливался. Срабатывал только сигнал `changed::intensity`,
который вызывал `_applyCurrentSettings()` напрямую.

**Решение:**  
Убрали зависимость от `restore-state` — всегда применяем по `effect-enabled`:

```js
// Стало:
_restoreState() {
    const enabled = this._settings.get_boolean('effect-enabled');
    if (enabled) {
        this._applyCurrentSettings();
    } else {
        this._effectManager.disableEffect();
    }
}
```

**Файл:** [`extension.js`](./extension.js)

---

## 🔴 БАГ 6 — Фильтр слетает при фокусе на Telegram / Electron-приложениях (НЕ РЕШЁН)

**Когда:** Открыть Telegram → нажать на канал → фильтр исчезает.  
Возвращается при переключении на другое окно.

**Симптом из логов:**
```
Failed to create offscreen effect framebuffer:
Failed to create texture 2d due to size/format constraints
```
(десятки записей подряд в момент фокуса на Telegram)

**Причина:**  
`Clutter.DesaturateEffect` и `Clutter.BrightnessContrastEffect` — это
**offscreen-эффекты** (наследники `Clutter.OffscreenEffect`). Для работы они
создают GPU-текстуру размером с actor, к которому применены (в нашем случае
`Main.uiGroup` = весь экран).

Когда Telegram (Electron/WebKit) открывает канал, он создаёт нестандартные
буферы или меняет масштаб содержимого. Mutter не может выделить offscreen-текстуру
и **молча прекращает рендерить эффект**, хотя технически он остаётся привязан
к актору.

Это **системная проблема Mutter/Clutter** — та же ошибка воспроизводится
в `tint-all@amarovita`, `desaturate_all@nicolas.brack.mail.be` и
`gnomebedtime@ionutbortis.gmail.com` (все используют ту же архитектуру).

**Попытка фикса 1 — Watchdog через `notify::focus-window`:**  
Подписались на `global.display → notify::focus-window` и `global.stage → notify::size`.
При срабатывании проверяли `get_effect()` и переприкрепляли.

❌ Не сработало: `get_effect()` возвращает объект эффекта даже когда он
перестал рендериться. Clutter не снимает эффект — он просто тихо не применяется.

**Возможные подходы для дальнейшего исследования:**

| Подход | Описание | Риск |
|--------|----------|------|
| Применять к каждому `Meta.WindowActor` отдельно | Текстура каждого окна мала → нет ограничений по размеру | Сложно: надо следить за появлением/закрытием окон |
| Использовать `Shell.GLSLEffect` | GNOME-специфичный шейдер, другой путь рендеринга | Тоже наследник OffscreenEffect, вероятно та же проблема |
| Цветовой оверлей (St.Widget + alpha blend) | Без offscreen, не требует framebuffer | Только для тонирования; чёрно-белый режим невозможен |
| Gamma ramp / ICC profile через colord | Системный уровень, нет проблем с GPU текстурами | Нет GJS API для прямого управления гаммой |
| Ждать фикса в Mutter | Upstream баг, не зависит от нас | Не контролируемо |

**Файлы:** [`lib/effectManager.js`](./lib/effectManager.js)

---

## 🔴 БАГ 7 — Окна становятся невидимыми при включении фильтра (в per-window режиме)

**Когда:** Включить фильтр при использовании per-window `Shell.GLSLEffect`.

**Симптом:**Все окна сразу скрываются (становятся прозрачными/невидимыми).

**Логи:**
```
Failed to link GLSL program:
error: `u_intensity' redeclared
error: `u_desat' redeclared
error: `u_tint' redeclared
error: `u_tint_mix' redeclared
```

**Причина:**  
Каждый создаваемый экземпляр `PasynkovTintEffect` на окнах добавлял строку объявления `uniform float u_intensity;` в шейдерную программу Cogl. Cogl объединял их, получая дублирующиеся переменные и ошибку линковки GLSL. Из-за ошибки линковки окно рендерилось прозрачным.

**Решение:**  
Обернуть определение uniform-переменных в `#ifndef PASYNKOV_TINT_UNIFORMS`:
```glsl
#ifndef PASYNKOV_TINT_UNIFORMS
#define PASYNKOV_TINT_UNIFORMS
uniform float u_intensity;
uniform float u_desat;
uniform vec3  u_tint;
uniform float u_tint_mix;
#endif
```

---

## Быстрый справочник

### Структура расширения
```
extension.js          — lifecycle (enable/disable), настройки, восстановление
lib/effectManager.js  — применение Clutter-эффектов, watchdog
lib/indicator.js      — иконка в трее, popup-меню, скролл интенсивности
lib/presets.js        — список пресетов и функции цикла
prefs.js              — окно настроек (GTK4 + Adwaita)
schemas/              — GSettings XML + скомпилированная схема
```

### Команды разработки
```bash
# Синхронизировать проект → расширение
rsync -av --exclude='.git' --exclude='Pasynkov_Tint_TZ.md' \
  "/home/fedor/projects/Pasynkov Tint/" \
  "/home/fedor/.local/share/gnome-shell/extensions/pasynkov-tint@fedor-pasynkov.ru/"

# Перекомпилировать схемы
glib-compile-schemas "/home/fedor/projects/Pasynkov Tint/schemas/"

# Перезагрузить расширение (без выхода из сессии)
gnome-extensions disable pasynkov-tint@fedor-pasynkov.ru && sleep 1 && gnome-extensions enable pasynkov-tint@fedor-pasynkov.ru

# Смотреть логи в реальном времени
journalctl /usr/bin/gnome-shell -f | grep -i "pasynkov\|offscreen\|texture"

# Экстренное отключение (если серый экран)
mv ~/.local/share/gnome-shell/extensions/pasynkov-tint@fedor-pasynkov.ru \
   ~/.local/share/gnome-shell/extensions/pasynkov-tint@fedor-pasynkov.ru.disabled
```
