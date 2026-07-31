#!/usr/bin/env gjs

const { GObject, St, Shell } = imports.gi;
const AppDisplay = imports.ui.appDisplay;

console.log("AppDisplay.AppIcon available:", typeof AppDisplay.AppIcon);
if (AppDisplay.AppIcon) {
    console.log("AppDisplay.AppIcon parent:", GObject.type_name(GObject.type_parent(AppDisplay.AppIcon)));
}
