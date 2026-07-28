/**
 * Pasynkov Tint - Effect Manager
 * Uses native Clutter.DesaturateEffect and Clutter.BrightnessContrastEffect
 * for GPU-accelerated safe desktop color tinting.
 *
 * HOW IT WORKS:
 *   - DesaturateEffect drains saturation from the entire desktop.
 *     factor=0.0 → no change, factor=1.0 → pure grayscale.
 *   - BrightnessContrastEffect shifts brightness/contrast channels
 *     to re-add the desired tint hue on top of the desaturated image.
 *   - For Grayscale preset, BC effect is set to neutral (127,127,127).
 */

const { Clutter } = imports.gi;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { getPreset } = Me.imports.lib.presets;

const EFFECT_DESAT_NAME = 'pasynkov-tint-desaturate';
const EFFECT_BC_NAME    = 'pasynkov-tint-brightness-contrast';

/**
 * Color profiles: [brightness_color, contrast_color]
 * At max intensity (level=255): these are the target brightness/contrast values.
 * At min intensity (level=0):   values collapse to neutral (127, 127, 127).
 *
 * Formula: result = round((target - 127) * level/255 + 127)
 */
const COLOR_PROFILES = {
    off:       null,
    amber:     [{ red: 143, green:  71, blue:   0, alpha: 255 },
                { red: 143, green: 135, blue: 127, alpha: 255 }],
    green:     [{ red:   0, green: 143, blue:   0, alpha: 255 },
                { red: 127, green: 143, blue: 127, alpha: 255 }],
    cyan:      [{ red:   0, green: 127, blue: 143, alpha: 255 },
                { red: 127, green: 127, blue: 143, alpha: 255 }],
    sepia:     [{ red: 143, green: 127, blue:  95, alpha: 255 },
                { red: 143, green: 127, blue: 127, alpha: 255 }],
    grayscale: [{ red: 127, green: 127, blue: 127, alpha: 255 },
                { red: 127, green: 127, blue: 127, alpha: 255 }],
};

// Neutral color for BC effect when no tinting is needed
const NEUTRAL_COLOR = { red: 127, green: 127, blue: 127, alpha: 255 };

var EffectManager = class EffectManager {
    constructor() {
        this._desatEffect    = null;
        this._bcEffect       = null;
        this._currentPresetId = 'off';
        this._currentIntensity = 0.65;
        this._enabled        = false;
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
            // Add BC first so desat applies over it
            if (!Main.uiGroup.get_effect(EFFECT_BC_NAME)) {
                Main.uiGroup.add_effect_with_name(EFFECT_BC_NAME, this._bcEffect);
            }
            if (!Main.uiGroup.get_effect(EFFECT_DESAT_NAME)) {
                Main.uiGroup.add_effect_with_name(EFFECT_DESAT_NAME, this._desatEffect);
            }
        } catch (e) {
            console.error('[Pasynkov Tint] Error attaching effects:', e);
        }
    }

    _removeFromUiGroup() {
        if (!Main.uiGroup) return;
        try {
            Main.uiGroup.remove_effect_by_name(EFFECT_DESAT_NAME);
        } catch (_) {}
        try {
            Main.uiGroup.remove_effect_by_name(EFFECT_BC_NAME);
        } catch (_) {}
    }

    /** Lerp a channel value towards neutral (127) based on level (0–255). */
    _lerp(channel, level) {
        return Math.round((channel - 127) * level / 255 + 127);
    }

    _applyColorProfile(profile, level) {
        const b = profile[0];
        const c = profile[1];
        this._bcEffect.brightness = new Clutter.Color({
            red:   this._lerp(b.red,   level),
            green: this._lerp(b.green, level),
            blue:  this._lerp(b.blue,  level),
            alpha: 255
        });
        this._bcEffect.contrast = new Clutter.Color({
            red:   this._lerp(c.red,   level),
            green: this._lerp(c.green, level),
            blue:  this._lerp(c.blue,  level),
            alpha: 255
        });
    }

    enableEffect(presetId, intensity) {
        const preset = getPreset(presetId);
        this._currentPresetId  = preset.id;
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
            console.error(`[Pasynkov Tint] Failed to enable "${presetId}":`, e);
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
            presetId === 'off'
                ? this.disableEffect()
                : this.enableEffect(presetId, this._currentIntensity);
        }
    }

    setIntensity(intensity) {
        this._currentIntensity = Math.max(0.05, Math.min(1.0, intensity));
        if (this._enabled && this._currentPresetId !== 'off') {
            this.refresh();
        }
    }

    refresh() {
        if (!this._enabled || !this._desatEffect || !this._bcEffect ||
            this._currentPresetId === 'off') {
            return;
        }

        try {
            // DesaturateEffect: intensity drives full desaturation.
            // At 100% intensity → factor = 1.0 → pure grayscale base.
            this._desatEffect.factor = this._currentIntensity;

            // BrightnessContrastEffect: adds the tint color on top.
            const profile = COLOR_PROFILES[this._currentPresetId] || COLOR_PROFILES.grayscale;
            // level is how strongly the tint color is applied (0=neutral, 255=full tint)
            const level = Math.round(this._currentIntensity * 255);
            this._applyColorProfile(profile, level);

        } catch (e) {
            console.error('[Pasynkov Tint] Error in refresh():', e);
            this.disableEffect();
        }
    }

    isEnabled() {
        return this._enabled;
    }

    destroy() {
        this.disableEffect();
        this._desatEffect = null;
        this._bcEffect    = null;
    }
};
