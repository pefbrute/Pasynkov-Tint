/**
 * Pasynkov Tint - Effect Manager (per-window architecture)
 *
 * WHY PER-WINDOW:
 *   Applying any Shell.GLSLEffect (or Clutter.OffscreenEffect) to Main.uiGroup
 *   requires a GPU texture the size of the entire screen. When Qt/GTK apps
 *   (e.g. Telegram) trigger Wayland surface updates, Mutter fails to allocate
 *   that texture and silently stops rendering the effect.
 *
 *   Per-window: each MetaWindowActor gets its own effect instance.
 *   Each window's texture is at most window-sized — no size/format failures.
 *
 * COVERAGE:
 *   - global.get_window_actors()       → all application windows
 *   - Main.panel                       → top bar
 *   - Main.layoutManager._backgroundGroup → desktop wallpaper
 *
 *   Not covered: Overview, lock screen, notifications overlay.
 *
 * LIFECYCLE:
 *   New windows are caught via global.display 'window-created' → idle_add →
 *   _syncWindowActors(). Destroyed windows clean up via actor 'destroy' signal.
 */

const { GObject, Shell, GLib } = imports.gi;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { getPreset } = Me.imports.lib.presets;

const EFFECT_NAME = 'pasynkov-tint-unified';

// ─── GLSL snippet ─────────────────────────────────────────────────────────────
// Appended after COGL's default texture sampling (cogl_color_out is already set).

const SHADER_DECL = `
#ifndef PASYNKOV_TINT_UNIFORMS
#define PASYNKOV_TINT_UNIFORMS
uniform float u_intensity;
uniform float u_desat;
uniform vec3  u_tint;
uniform float u_tint_mix;
#endif
`;

const SHADER_CODE = `
float luma    = dot(cogl_color_out.rgb, vec3(0.2126, 0.7152, 0.0722));
vec3  desatd  = mix(cogl_color_out.rgb, vec3(luma), u_desat * u_intensity);
vec3  tinted  = desatd * u_tint;
cogl_color_out.rgb = mix(desatd, tinted, u_tint_mix * u_intensity);
`;

// ─── Effect class ─────────────────────────────────────────────────────────────

const PasynkovTintEffect = GObject.registerClass(
class PasynkovTintEffect extends Shell.GLSLEffect {
    _init() {
        super._init();
        this.add_glsl_snippet(Shell.SnippetHook.FRAGMENT, SHADER_DECL, SHADER_CODE, false);
        this._uIntensity = this.get_uniform_location('u_intensity');
        this._uDesat     = this.get_uniform_location('u_desat');
        this._uTint      = this.get_uniform_location('u_tint');
        this._uTintMix   = this.get_uniform_location('u_tint_mix');
        this._p = { intensity: 0.0, desat: 0.0, tint: [1.0, 1.0, 1.0], tintMix: 0.0 };
    }

    setParams(intensity, desat, tint, tintMix) {
        this._p = { intensity, desat, tint, tintMix };
        this.queue_repaint();
    }

    // GNOME 42–44: vfunc_paint_target(paintContext)
    // GNOME 45+:   vfunc_paint_target(node, paintContext)
    vfunc_paint_target(nodeOrCtx, paintCtxOrUndef) {
        const p = this._p;
        this.set_uniform_float(this._uIntensity, 1, [p.intensity]);
        this.set_uniform_float(this._uDesat,     1, [p.desat]);
        this.set_uniform_float(this._uTint,      3,  p.tint);
        this.set_uniform_float(this._uTintMix,   1, [p.tintMix]);

        if (paintCtxOrUndef !== undefined)
            super.vfunc_paint_target(nodeOrCtx, paintCtxOrUndef);
        else
            super.vfunc_paint_target(nodeOrCtx);
    }
});

// ─── Effect Manager ───────────────────────────────────────────────────────────

var EffectManager = class EffectManager {
    constructor() {
        this._currentPresetId  = 'off';
        this._currentIntensity = 0.65;
        this._enabled          = false;

        // Map<MetaWindowActor, {effect: PasynkovTintEffect, destroyId: number}>
        this._windowEffects = new Map();

        // Effects on non-window actors
        this._panelEffect = null;
        this._bgEffect    = null;

        // Signal IDs
        this._windowCreatedId  = null;
        this._focusSignalId    = null;
        this._recoverySourceId = null;
    }

    // ── Effect factory ───────────────────────────────────────────────────────

    _makeEffect() {
        return new PasynkovTintEffect();
    }

    _paramsFor(presetId, intensity) {
        const preset = getPreset(presetId);
        return [intensity, preset.desat, preset.tint, preset.tintMix];
    }

    _applyParamsToEffect(effect) {
        effect.setParams(...this._paramsFor(this._currentPresetId, this._currentIntensity));
    }

    // ── Per-window management ────────────────────────────────────────────────

    /**
     * Ensure every current MetaWindowActor has our effect.
     * Called on enable and whenever a new window appears.
     */
    _syncWindowActors() {
        if (!this._enabled) return;

        const currentActors = new Set(global.get_window_actors());

        // Add effect to new actors
        for (const actor of currentActors) {
            if (this._windowEffects.has(actor)) continue;
            this._attachToWindowActor(actor);
        }

        // Purge stale map entries (actor was destroyed without our signal firing)
        for (const actor of this._windowEffects.keys()) {
            if (!currentActors.has(actor))
                this._windowEffects.delete(actor);
        }
    }

    _attachToWindowActor(actor) {
        if (!actor || actor.is_finalized?.()) return;

        // Skip if already has our effect
        if (actor.get_effect(EFFECT_NAME)) return;

        try {
            const effect = this._makeEffect();
            this._applyParamsToEffect(effect);
            actor.add_effect_with_name(EFFECT_NAME, effect);

            // Clean up when actor is destroyed
            const destroyId = actor.connect('destroy', () => {
                this._windowEffects.delete(actor);
            });

            this._windowEffects.set(actor, { effect, destroyId });
        } catch (e) {
            console.error('[Pasynkov Tint] attach to window actor failed:', e);
        }
    }

    _detachFromAllWindowActors() {
        for (const [actor, data] of this._windowEffects) {
            try { actor.disconnect(data.destroyId); } catch (_) {}
            try { actor.remove_effect_by_name(EFFECT_NAME); } catch (_) {}
        }
        this._windowEffects.clear();
    }

    // ── Panel & background ───────────────────────────────────────────────────

    _attachToPanel() {
        if (!Main.panel || this._panelEffect) return;
        try {
            this._panelEffect = this._makeEffect();
            this._applyParamsToEffect(this._panelEffect);
            Main.panel.add_effect_with_name(EFFECT_NAME, this._panelEffect);
        } catch (e) {
            console.error('[Pasynkov Tint] attach to panel failed:', e);
            this._panelEffect = null;
        }
    }

    _detachFromPanel() {
        if (!Main.panel || !this._panelEffect) return;
        try { Main.panel.remove_effect_by_name(EFFECT_NAME); } catch (_) {}
        this._panelEffect = null;
    }

    _attachToBackground() {
        const bgGroup = Main.layoutManager._backgroundGroup;
        if (!bgGroup || this._bgEffect) return;
        try {
            this._bgEffect = this._makeEffect();
            this._applyParamsToEffect(this._bgEffect);
            bgGroup.add_effect_with_name(EFFECT_NAME, this._bgEffect);
        } catch (e) {
            console.error('[Pasynkov Tint] attach to background failed:', e);
            this._bgEffect = null;
        }
    }

    _detachFromBackground() {
        const bgGroup = Main.layoutManager._backgroundGroup;
        if (!bgGroup || !this._bgEffect) return;
        try { bgGroup.remove_effect_by_name(EFFECT_NAME); } catch (_) {}
        this._bgEffect = null;
    }

    // ── Update all active effects ────────────────────────────────────────────

    _refreshAll() {
        for (const { effect } of this._windowEffects.values())
            this._applyParamsToEffect(effect);

        if (this._panelEffect)
            this._applyParamsToEffect(this._panelEffect);

        if (this._bgEffect)
            this._applyParamsToEffect(this._bgEffect);
    }

    // ── Watchdog ─────────────────────────────────────────────────────────────

    _startWatchdog() {
        // New windows: sync after idle (window-created fires before actor is ready)
        if (!this._windowCreatedId) {
            this._windowCreatedId = global.display.connect('window-created', () => {
                GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                    this._syncWindowActors();
                    return GLib.SOURCE_REMOVE;
                });
            });
        }

        // Focus change: queue_repaint on all window effects after short delay
        if (!this._focusSignalId) {
            this._focusSignalId = global.display.connect('notify::focus-window', () => {
                this._scheduleRecovery();
            });
        }
    }

    _stopWatchdog() {
        if (this._windowCreatedId) {
            global.display.disconnect(this._windowCreatedId);
            this._windowCreatedId = null;
        }
        if (this._focusSignalId) {
            global.display.disconnect(this._focusSignalId);
            this._focusSignalId = null;
        }
        this._cancelRecovery();
    }

    _cancelRecovery() {
        if (this._recoverySourceId) {
            GLib.source_remove(this._recoverySourceId);
            this._recoverySourceId = null;
        }
    }

    _scheduleRecovery() {
        this._cancelRecovery();
        this._recoverySourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
            this._recoverySourceId = null;
            if (!this._enabled) return GLib.SOURCE_REMOVE;

            // Sync in case a new window appeared with the focus change
            this._syncWindowActors();

            // Ask all effects to repaint
            for (const { effect } of this._windowEffects.values())
                effect.queue_repaint();

            return GLib.SOURCE_REMOVE;
        });
    }

    // ── Public API ───────────────────────────────────────────────────────────

    enableEffect(presetId, intensity) {
        const preset = getPreset(presetId);
        this._currentPresetId  = preset.id;
        this._currentIntensity = Math.max(0.05, Math.min(1.0, intensity));

        if (preset.id === 'off') {
            this.disableEffect();
            return;
        }

        this._enabled = true;

        this._attachToBackground();
        this._syncWindowActors();
        this._attachToPanel();
        this._startWatchdog();
    }

    disableEffect() {
        this._stopWatchdog();
        this._detachFromAllWindowActors();
        this._detachFromPanel();
        this._detachFromBackground();
        this._enabled = false;
    }

    setPreset(presetId) {
        this._currentPresetId = presetId;
        if (this._enabled) {
            presetId === 'off'
                ? this.disableEffect()
                : (() => { this._refreshAll(); })();
        }
    }

    setIntensity(intensity) {
        this._currentIntensity = Math.max(0.05, Math.min(1.0, intensity));
        if (this._enabled && this._currentPresetId !== 'off')
            this._refreshAll();
    }

    refresh() {
        if (this._enabled && this._currentPresetId !== 'off')
            this._refreshAll();
    }

    isEnabled() {
        return this._enabled;
    }

    destroy() {
        this.disableEffect();
    }
};
