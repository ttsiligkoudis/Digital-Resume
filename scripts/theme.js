/* Theme toggle + print preparation.
   The initial theme is applied by an inline script in <head> before first
   paint — this file only wires the button and keeps it in sync with the OS
   when the visitor has never made an explicit choice. */
(function () {
    'use strict';

    /* A collapsed <details> prints as a bare heading with its content dropped,
       and Chromium hides the content at the UA level, so CSS alone can't bring
       it back. Open everything before the print snapshot and restore after. */
    var reopened = [];

    function expandForPrint() {
        reopened = [];
        document.querySelectorAll('details:not([open])').forEach(function (d) {
            d.open = true;
            reopened.push(d);
        });
    }

    function restoreAfterPrint() {
        reopened.forEach(function (d) { d.open = false; });
        reopened = [];
    }

    window.addEventListener('beforeprint', expandForPrint);
    window.addEventListener('afterprint', restoreAfterPrint);

    /* Headless print (and Safari) fire the media query rather than the events. */
    var printMedia = window.matchMedia('print');
    printMedia.addEventListener('change', function (e) {
        if (e.matches) expandForPrint(); else restoreAfterPrint();
    });

    var STORAGE_KEY = 'portfolio-theme';
    var ICONS = { light: '☀', dark: '☾' };

    var root = document.documentElement;
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    var icon = toggle.querySelector('.theme-toggle__icon');
    var media = window.matchMedia('(prefers-color-scheme: light)');

    function stored() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null; // Private mode / blocked storage — fall back to the OS.
        }
    }

    function effective() {
        return stored() || (media.matches ? 'light' : 'dark');
    }

    function render(theme) {
        if (icon) icon.textContent = ICONS[theme];
        toggle.setAttribute(
            'aria-label',
            theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'
        );
        toggle.setAttribute('aria-pressed', String(theme === 'light'));
    }

    function apply(theme) {
        root.setAttribute('data-theme', theme);
        render(theme);
    }

    render(effective());

    toggle.addEventListener('click', function () {
        var next = effective() === 'light' ? 'dark' : 'light';
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch (e) {
            /* Not persisting is survivable; the page still flips. */
        }
        apply(next);
    });

    // Follow the OS only while the visitor hasn't picked a side.
    media.addEventListener('change', function () {
        if (!stored()) apply(media.matches ? 'light' : 'dark');
    });
})();
