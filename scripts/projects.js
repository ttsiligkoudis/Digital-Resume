/* Marks a project's "Live demo" link as offline when the deployment is down.
 *
 * Why this needs a server: a page cannot read another origin's HTTP status.
 * fetch() in no-cors mode resolves for a 502 exactly as it does for a 200, so
 * the status is invisible; and the <img onerror> trick needs the origin to
 * serve a real image at a known path, which none of these deployments do
 * (one 404s on /favicon.ico, another answers it with HTML). The only honest
 * check is made server-side, so this asks a small status endpoint.
 *
 * Nothing here is load-bearing. With no endpoint configured, or if the
 * request fails, the page stays exactly as rendered — every demo link already
 * sits next to a Source link, so a dead demo is never a dead end.
 *
 * To switch it on, deploy tools/status-worker.js and put its URL below.
 */
(function () {
    'use strict';

    var ENDPOINT = '';   // e.g. 'https://status.myportofolio.eu'
    if (!ENDPOINT) return;

    var links = Array.prototype.slice.call(
        document.querySelectorAll('.card--project__links a[data-live-demo]')
    );
    if (!links.length) return;

    var urls = links.map(function (a) { return a.href; });

    var timeout = setTimeout(function () { controller.abort(); }, 6000);
    var controller = new AbortController();

    fetch(ENDPOINT + '?urls=' + encodeURIComponent(urls.join(',')), {
        signal: controller.signal
    })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (status) {
            if (!status) return;
            links.forEach(function (a) {
                // Only act on an explicit false. Unknown stays untouched, so a
                // partial answer never mislabels a demo that is actually up.
                if (status[a.href] === false) {
                    a.classList.add('is-down');
                    a.setAttribute('aria-disabled', 'true');
                    a.removeAttribute('href');
                }
            });
        })
        .catch(function () { /* Endpoint unreachable — leave the page alone. */ })
        .then(function () { clearTimeout(timeout); });
})();
