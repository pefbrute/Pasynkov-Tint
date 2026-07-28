/**
 * Pasynkov Tint - Effect Manager
 * Uses native Clutter.DesaturateEffect and Clutter.BrightnessContrastEffect for GPU-accelerated,
 * 100% safe desktop color tinting without obscuring windows or text.
 */

const { Clutter } = imports.gi;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { getPreset } = Me.imports.lib.presets;

const EFFECT_DESAT_NAME = 'pasynkov-tint-desaturate';
const EFFECT_BC_NAME = 'pasynkov-tint-brightness-contrast';

// Color channel modulation matrices for presets
const COLOR_PROFILES = {
    off: null,
    amber: [
        { red: 143, green: 71, blue: 0, alpha: 255 },
        { red: 143, green: 135, blue: 127, alpha: 255 }
    ],
    green: [
        { red: 63, green: 127, blue: 0, alpha: 255 },
        { red: 127, green: 127, blue: 127, alpha: 255 }
    ],
    cyan: [
        { red: 0, green: 127, blue: 143, alpha: 255 },
        { red: 127, green: 127, blue: 143, alpha: 255 }
    ],
    sepia: [
        { red: 143, green: 127, blue: 95, alpha: 255 },
        { red: 143, green: 127, blue: 127, alpha: 255 }
    ],
    grayscale: [
        { red: 127, green: 127, blue: 127, alpha: 255 },
        { red: 127, green: 127, blue: 127, alpha: 255 }
    ]
};

var EffectManager = class EffectManager {
    constructor() {
        this._desatEffect = null;
        this._bcEffect = null;
        this._currentPresetId = 'off';
        this._currentIntensity = 0.65;
        this._enabled = false;
    }

    _ensureEffectsCreated() {
        if (!this._desatEffect) {
            this._desatEffect = new Clutter.DesaturateEffect();
        }
        if (!this._bcEffect) {
            this._bcEffect = new Clutter.BrightnessContrastEffect();
        }
    }

    _attachToUiGroup() {
        if (!Main.uiGroup) return;

        try {
            if (!Main.uiGroup.get_effect(EFFECT_BC_NAME)) {
                Main.uiGroup.add_effect_with_name(EFFECT_BC_NAME, this._bcEffect);
            }
            if (!Main.uiGroup.get_effect(EFFECT_DESAT_NAME)) {
                Main.uiGroup.add_effect_with_name(EFFECT_DESAT_NAME, this._desatEffect);
            }
        } catch (e) {
            console.error('[Pasynkov Tint] Error attaching effects to uiGroup:', e);
        }
    }

    _removeFromUiGroup() {
        if (!Main.uiGroup) return;

        try {
            Main.uiGroup.remove_effect_by_name(EFFECT_DESAT_NAME);
            Main.uiGroup.remove_effect_by_name(EFFECT_BC_NAME);
        } catch (e) {
            console.error('[Pasynkov Tint] Error removing effects from uiGroup:', e);
        }
    }

    _calcLevel(c, level) {
        return Math.round((c - 127) * level / 255 + 127);
    }

    _adjustColor(color, level) {
        return {
            red: this._calcLevel(color.red, level),
            green: this._calcLevel(color.green, level),
            blue: this._calcLevel(color.blue, level),
            alpha: color.alpha
        };
    }

    enableEffect(presetId, intensity) {
        const preset = getPreset(presetId);
        this._currentPresetId = preset.id;
        this._currentIntensity = Math.max(0.05, Math.min(1.0, intensity));

        if (preset.id === 'off') {
            this.disableEffect();
            return;
        }

        try {
            this._ensureEffectsCreated();
            this._attachToUiGroup();
            this._enabled = true;
            this.refresh();
        } catch (e) {
            console.error(`[Pasynkov Tint] Failed to enable effect "${presetId}":`, e);
            this.disableEffect();
        }
    }

    disableEffect() {
        try {
            this._removeFromUiGroup();
        } catch (e) {
            console.error('[Pasynkov Tint] Error in disableEffect:', e);
        } finally {
            this._enabled = false;
        }
    }

    setPreset(presetId) {
        this._currentPresetId = presetId;
        if (this._enabled) {
            if (presetId === 'off') {
                this.disableEffect();
            } else {
                this.enableEffect(presetId, this._currentIntensity);
            }
        }
    }

    setIntensity(intensity) {
        this._currentIntensity = Math.max(0.05, Math.min(1.0, intensity));
        if (this._enabled && this._currentPresetId !== 'off') {
            this.refresh();
        }
    }

    refresh() {
        if (!this._enabled || !this._desatEffect || !this._bcEffect || this._currentPresetId === 'off') {
            return;
        }

        try {
            // 1. Update desaturation factor (0.0 to 1.0)
            this._desatEffect.factor = this._currentIntensity;

            // 2. Update Brightness / Contrast tint colors
            const profile = COLOR_PROFILES[this._currentPresetId] || COLOR_PROFILES.amber;
            const level = Math.round(this._currentIntensity * 255);

            const bColor = new Clutter.Color(this._adjustColor(profile[0], level));
            const cColor = new Clutter.Color(this._adjustColor(profile[1], level));

            this._bcEffect.brightness = bColor;
            this._bcEffect.contrast = cColor;
        } catch (e) {
            console.error('[Pasynkov Tint] Error applying effect parameters:', e);
            this.disableEffect();
        }
    }

    destroy() {
        this.disableEffect();
        this._desatEffect = null;
        this._bcEffect = null;
    }
};
