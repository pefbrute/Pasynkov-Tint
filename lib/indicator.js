/**
 * Pasynkov Tint - Top Bar Panel Indicator
 * Implements panel button, popup menu controls, mouse scroll handlers, and OSD.
 */

const { GObject, St, Clutter, Gio } = imports.gi;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Slider = imports.ui.slider;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

function _(str) {
    if (ExtensionUtils && ExtensionUtils.gettext) {
        return ExtensionUtils.gettext(str);
    }
    return str;
}

const { getNextPresetId, getPreset, PRESETS, PRESET_ORDER } = Me.imports.lib.presets;

var PasynkovTintIndicator = GObject.registerClass(
class PasynkovTintIndicator extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, 'Pasynkov Tint', false);
        this._extension = extension;
        this._settings = ExtensionUtils.getSettings();

        const iconPath = `${extension.path}/icons/pasynkov-tint-symbolic.svg`;
        this._gicon = Gio.icon_new_for_string(iconPath);
        this._icon = new St.Icon({
            gicon: this._gicon,
            style_class: 'system-status-icon pasynkov-tint-icon'
        });
        this.add_child(this._icon);

        this._buildMenu();

        this.connect('scroll-event', this._onScroll.bind(this));
        this.connect('button-press-event', this._onButtonPress.bind(this));

        this._settingsSignals = [];
        this._bindSettings();
        this._updateUi();
    }

    _bindSettings() {
        const keys = ['effect-enabled', 'preset', 'intensity', 'click-action', 'show-osd'];
        keys.forEach(key => {
            const id = this._settings.connect(`changed::${key}`, () => this._updateUi());
            this._settingsSignals.push(id);
        });
    }

    _buildMenu() {
        // 1. Switch Item
        this._switchItem = new PopupMenu.PopupSwitchMenuItem(
            _('Effect Enabled'),
            this._settings.get_boolean('effect-enabled')
        );
        this._switchItem.connect('toggled', (item, state) => {
            this._settings.set_boolean('effect-enabled', state);
        });
        this.menu.addMenuItem(this._switchItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // 2. Preset Selection Items
        this._presetMenuItems = {};
        const presetHeader = new PopupMenu.PopupMenuItem(_('Presets'), { reactive: false });
        presetHeader.label.add_style_class_name('popup-menu-item-header');
        this.menu.addMenuItem(presetHeader);

        PRESET_ORDER.forEach(presetId => {
            const preset = PRESETS[presetId];
            const label = _(preset.name);
            const menuItem = new PopupMenu.PopupMenuItem(label);
            
            menuItem.connect('activate', () => {
                this._settings.set_string('preset', presetId);
                this._settings.set_boolean('effect-enabled', presetId !== 'off');
            });

            this._presetMenuItems[presetId] = menuItem;
            this.menu.addMenuItem(menuItem);
        });

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // 3. Intensity Slider
        const intensityHeader = new PopupMenu.PopupMenuItem(_('Intensity'), { reactive: false });
        this._intensityValueLabel = new St.Label({
            text: `${Math.round(this._settings.get_double('intensity') * 100)}%`,
            x_align: Clutter.ActorAlign.END,
            x_expand: true
        });
        intensityHeader.add_child(this._intensityValueLabel);
        this.menu.addMenuItem(intensityHeader);

        const sliderMenuItem = new PopupMenu.PopupBaseMenuItem({ activate: false });
        this._slider = new Slider.Slider(this._settings.get_double('intensity'));
        this._slider.connect('notify::value', (slider) => {
            const val = Math.round(slider.value * 20) / 20;
            const clamped = Math.max(0.05, Math.min(1.0, val));
            this._intensityValueLabel.text = `${Math.round(clamped * 100)}%`;
            this._settings.set_double('intensity', clamped);
        });
        sliderMenuItem.add_child(this._slider);
        this.menu.addMenuItem(sliderMenuItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // 4. Emergency Reset Button
        const emergencyItem = new PopupMenu.PopupMenuItem(_('Reset All Filters'));
        emergencyItem.connect('activate', () => {
            this.emergencyReset();
        });
        this.menu.addMenuItem(emergencyItem);

        // 5. Preferences Button
        const prefsItem = new PopupMenu.PopupMenuItem(_('Preferences'));
        prefsItem.connect('activate', () => {
            ExtensionUtils.openPreferences();
        });
        this.menu.addMenuItem(prefsItem);
    }

    emergencyReset() {
        try {
            this._settings.set_boolean('effect-enabled', false);
            this._settings.set_string('preset', 'off');
            this._settings.set_double('intensity', 0.65);
            if (this._extension && this._extension._effectManager) {
                this._extension._effectManager.disableEffect();
            }
            if (Main.osdWindowManager) {
                Main.osdWindowManager.show(-1, this._gicon, 'Pasynkov Tint · Reset', 0);
            }
        } catch (e) {
            console.error('[Pasynkov Tint] Error during emergencyReset:', e);
        }
    }

    _updateUi() {
        const enabled = this._settings.get_boolean('effect-enabled');
        const currentPresetId = this._settings.get_string('preset');
        const intensity = this._settings.get_double('intensity');

        if (enabled && currentPresetId !== 'off') {
            this._icon.remove_style_class_name('pasynkov-tint-icon-disabled');
            this._icon.add_style_class_name('pasynkov-tint-icon-enabled');
            this.add_style_class_name('pasynkov-tint-indicator-active');
        } else {
            this._icon.remove_style_class_name('pasynkov-tint-icon-enabled');
            this._icon.add_style_class_name('pasynkov-tint-icon-disabled');
            this.remove_style_class_name('pasynkov-tint-indicator-active');
        }

        this._switchItem.setToggleState(enabled);

        PRESET_ORDER.forEach(presetId => {
            const menuItem = this._presetMenuItems[presetId];
            if (menuItem) {
                if (presetId === currentPresetId && (enabled || presetId === 'off')) {
                    menuItem.setOrnament(PopupMenu.Ornament.DOT);
                } else {
                    menuItem.setOrnament(PopupMenu.Ornament.NONE);
                }
            }
        });

        this._slider.value = intensity;
        this._intensityValueLabel.text = `${Math.round(intensity * 100)}%`;
    }

    _onButtonPress(actor, event) {
        const button = event.get_button();
        const action = this._settings.get_string('click-action');

        if (button === 1) {
            if (action === 'cycle') {
                this.menu.close();
                const currentPresetId = this._settings.get_string('preset');
                const enabled = this._settings.get_boolean('effect-enabled');
                let effectiveId = enabled ? currentPresetId : 'off';
                let nextId = getNextPresetId(effectiveId);
                this._settings.set_string('preset', nextId);
                this._settings.set_boolean('effect-enabled', nextId !== 'off');
                return Clutter.EVENT_STOP;
            } else if (action === 'toggle') {
                this.menu.close();
                const enabled = this._settings.get_boolean('effect-enabled');
                this._settings.set_boolean('effect-enabled', !enabled);
                return Clutter.EVENT_STOP;
            }
        } else if (button === 3) {
            this.menu.toggle();
            return Clutter.EVENT_STOP;
        }
        return Clutter.EVENT_PROPAGATE;
    }

    _onScroll(actor, event) {
        const direction = event.get_scroll_direction();
        let currentIntensity = this._settings.get_double('intensity');
        let step = 0.05;
        let newIntensity = currentIntensity;

        if (direction === Clutter.ScrollDirection.UP) {
            newIntensity = Math.min(1.0, currentIntensity + step);
        } else if (direction === Clutter.ScrollDirection.DOWN) {
            newIntensity = Math.max(0.05, currentIntensity - step);
        } else if (direction === Clutter.ScrollDirection.SMOOTH) {
            const [dx, dy] = event.get_scroll_delta();
            if (dy < 0) newIntensity = Math.min(1.0, currentIntensity + step);
            else if (dy > 0) newIntensity = Math.max(0.05, currentIntensity - step);
        }

        newIntensity = Math.round(newIntensity * 100) / 100;
        if (newIntensity !== currentIntensity) {
            this._settings.set_double('intensity', newIntensity);
            if (this._settings.get_boolean('show-osd')) {
                this._showOsd(newIntensity);
            }
        }
        return Clutter.EVENT_STOP;
    }

    _showOsd(intensity) {
        try {
            const presetId = this._settings.get_string('preset');
            const preset = getPreset(presetId);
            const presetName = _(preset.name);
            const label = `Pasynkov Tint · ${presetName} · ${Math.round(intensity * 100)}%`;
            if (Main.osdWindowManager) {
                Main.osdWindowManager.show(-1, this._gicon, label, intensity);
            }
        } catch (e) {
            console.error('[Pasynkov Tint] OSD notification error:', e);
        }
    }

    destroy() {
        if (this._settingsSignals) {
            this._settingsSignals.forEach(id => this._settings.disconnect(id));
            this._settingsSignals = [];
        }
        super.destroy();
    }
});
