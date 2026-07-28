/**
 * Pasynkov Tint - Preset Definitions
 * Defines color filter presets and helper functions for cycling presets.
 */

var PRESETS = {
    off: {
        id: 'off',
        name: 'Off',
        mode: 0,
        color: [1.0, 1.0, 1.0]
    },
    amber: {
        id: 'amber',
        name: 'Amber',
        mode: 1,
        color: [1.0, 0.75, 0.25]
    },
    green: {
        id: 'green',
        name: 'Green',
        mode: 1,
        color: [0.25, 1.0, 0.35]
    },
    cyan: {
        id: 'cyan',
        name: 'Cyan',
        mode: 1,
        color: [0.25, 0.85, 1.0]
    },
    sepia: {
        id: 'sepia',
        name: 'Sepia',
        mode: 2,
        color: [1.0, 1.0, 1.0]
    },
    grayscale: {
        id: 'grayscale',
        name: 'Grayscale',
        mode: 3,
        color: [1.0, 1.0, 1.0]
    }
};

var PRESET_ORDER = ['off', 'amber', 'green', 'cyan', 'sepia', 'grayscale'];

function getNextPresetId(currentId) {
    const idx = PRESET_ORDER.indexOf(currentId);
    if (idx === -1 || idx === PRESET_ORDER.length - 1) {
        return PRESET_ORDER[0];
    }
    return PRESET_ORDER[idx + 1];
}

function getPreset(presetId) {
    return PRESETS[presetId] || PRESETS.amber;
}
