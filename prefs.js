/**
 * Pasynkov Tint - Preferences Window
 * Implements GTK4 / Libadwaita settings dialog.
 */

const { Adw, Gtk, Gio, GObject } = imports.gi;

let ExtensionUtils;
try {
    ExtensionUtils = imports.misc.extensionUtils;
} catch (e) {
    ExtensionUtils = null;
}

function _(str) {
    if (ExtensionUtils && ExtensionUtils.gettext) {
        return ExtensionUtils.gettext(str);
    }
    return str;
}

function init() {
    if (ExtensionUtils && ExtensionUtils.initTranslations) {
        ExtensionUtils.initTranslations();
    }
}

/**
 * Creates a Switch row compatible with both Libadwaita 1.0 (GNOME 42) and Libadwaita 1.4+ (GNOME 45+)
 */
function createSwitchRow(title, subtitle, settings, key) {
    if (Adw.SwitchRow) {
        const row = new Adw.SwitchRow({ title, subtitle });
        if (settings) {
            settings.bind(key, row, 'active', Gio.SettingsBindFlags.DEFAULT);
        }
        return row;
    } else {
        const row = new Adw.ActionRow({ title, subtitle });
        const toggle = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        if (settings) {
            settings.bind(key, toggle, 'active', Gio.SettingsBindFlags.DEFAULT);
        }
        row.add_suffix(toggle);
        row.activatable_widget = toggle;
        return row;
    }
}

function fillPreferencesWindow(window) {
    const settings = (ExtensionUtils && ExtensionUtils.getSettings) ? ExtensionUtils.getSettings() : null;

    // ==========================================
    // Page 1: General Settings (Основное)
    // ==========================================
    const generalPage = new Adw.PreferencesPage({
        title: _('General'),
        icon_name: 'preferences-system-symbolic'
    });
    window.add(generalPage);

    const generalGroup = new Adw.PreferencesGroup({
        title: _('Behavior'),
        description: _('Configure startup and interaction options')
    });
    generalPage.add(generalGroup);

    // Switch: Restore effect after login
    const restoreRow = createSwitchRow(
        _('Restore effect after login'),
        _('Automatically apply saved color filter on user startup'),
        settings,
        'restore-state'
    );
    generalGroup.add(restoreRow);

    // Combo: Primary Click Action
    const clickActionRow = new Adw.ComboRow({
        title: _('Primary Click Action'),
        subtitle: _('Behavior when clicking top bar indicator'),
        model: Gtk.StringList.new([_('Cycle Presets'), _('Toggle Effect'), _('Open Menu')])
    });
    
    const clickValues = ['cycle', 'toggle', 'menu'];
    const currentAction = settings ? settings.get_string('click-action') : 'cycle';
    const selectedIdx = clickValues.indexOf(currentAction);
    if (selectedIdx !== -1) {
        clickActionRow.selected = selectedIdx;
    }

    clickActionRow.connect('notify::selected', () => {
        const val = clickValues[clickActionRow.selected];
        if (val && settings) {
            settings.set_string('click-action', val);
        }
    });
    generalGroup.add(clickActionRow);

    // Switch: Show OSD Notifications
    const osdRow = createSwitchRow(
        _('Show Intensity OSD'),
        _('Display screen overlay when scrolling intensity wheel'),
        settings,
        'show-osd'
    );
    generalGroup.add(osdRow);

    // ==========================================
    // Page 2: Presets Information (Пресеты)
    // ==========================================
    const presetsPage = new Adw.PreferencesPage({
        title: _('Presets'),
        icon_name: 'color-select-symbolic'
    });
    window.add(presetsPage);

    const presetsGroup = new Adw.PreferencesGroup({
        title: _('Built-in Color Filters'),
        description: _('Overview of default visual filters available in Pasynkov Tint')
    });
    presetsPage.add(presetsGroup);

    const presetInfoList = [
        { name: _('Amber'), desc: _('Warm amber-yellow tint reducing harsh blue light') },
        { name: _('Green'), desc: _('Vintage monochrome green CRT display aesthetic') },
        { name: _('Cyan'), desc: _('Cool cyan-blue tint for high contrast focus') },
        { name: _('Sepia'), desc: _('Classic warm sepia photo filter matrix') },
        { name: _('Grayscale'), desc: _('Monochrome desaturation removing color distraction') }
    ];

    presetInfoList.forEach(p => {
        const row = new Adw.ActionRow({
            title: p.name,
            subtitle: p.desc
        });
        presetsGroup.add(row);
    });

    // ==========================================
    // Page 3: About (О расширении)
    // ==========================================
    const aboutPage = new Adw.PreferencesPage({
        title: _('About'),
        icon_name: 'help-about-symbolic'
    });
    window.add(aboutPage);

    const aboutGroup = new Adw.PreferencesGroup();
    aboutPage.add(aboutGroup);

    const nameRow = new Adw.ActionRow({
        title: 'Pasynkov Tint',
        subtitle: _('Version 0.1.0 MVP — Desktop Color Filters for GNOME Shell')
    });
    aboutGroup.add(nameRow);

    const authorRow = new Adw.ActionRow({
        title: _('Author'),
        subtitle: 'Fedor Pasynkov'
    });
    aboutGroup.add(authorRow);

    const licenseRow = new Adw.ActionRow({
        title: _('License'),
        subtitle: 'GNU General Public License v3.0 or later (GPL-3.0-or-later)'
    });
    aboutGroup.add(licenseRow);

    const creditRow = new Adw.ActionRow({
        title: _('Acknowledgements'),
        subtitle: _('Inspired by the Tint All extension by Amaro Vita')
    });
    aboutGroup.add(creditRow);
}
