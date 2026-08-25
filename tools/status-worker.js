/**
 * Cloudflare Worker — live-demo health check for the portfolio.
 *
 * The page cannot read another origin's HTTP status itself (see the note at
 * the top of scripts/projects.js), so it asks this instead:
 *
 *   GET /?urls=https://a.example,https://b.example
 *   -> { "https://a.example": true, "https://b.example": false }
 *
 * Deploy:  npx wrangler deploy tools/status-worker.js
 * Then set ENDPOINT in scripts/projects.js to the Worker's URL.
 *
 * ALLOWED_HOSTS is not optional. Without it this is an open request proxy —
 * anyone could point it at an internal address and use the true/false answer
 * as a port scanner. It probes a fixed set of my own deployments, nothing else.
 */

const ALLOWED_HOSTS = [
    'eshop.myportofolio.eu',
    'eshopapi.myportofolio.eu',
    'library.myportofolio.eu',
    'tools.myportofolio.eu',
    'chat.myportofolio.eu',
    'fileservice.myportofolio.eu',
    'hangman.myportofolio.eu',
];

const ALLOWED_ORIGINS = ['https://myportofolio.eu', 'https://www.myportofolio.eu'];

const PROBE_TIMEOUT_MS = 8000;
const CACHE_SECONDS = 300;   // A demo that just died can read as up for 5 min.
const MAX_URLS = 12;

function cors(origin) {
    return {
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Vary': 'Origin',
    };
}

/** Up means "the origin answered". A 404 on the path is still a live server;
 *  a 5xx from the edge, a refused connection or a timeout is not. */
async function isUp(url) {
    const attempt = async (method) => {
        const res = await fetch(url, {
            method,
            redirect: 'follow',
            signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
        });
        return res.status < 500;
    };

    try {
        return await attempt('HEAD');
    } catch {
        try {
            return await attempt('GET');   // Some hosts reject HEAD outright.
        } catch {
            return false;
        }
    }
}

export default {
    async fetch(request) {
        const origin = request.headers.get('Origin') || '';
        const headers = cors(origin);

        if (request.method === 'OPTIONS') return new Response(null, { headers });
        if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers });

        const raw = new URL(request.url).searchParams.get('urls') || '';
        const wanted = raw.split(',').map((u) => u.trim()).filter(Boolean).slice(0, MAX_URLS);

        const results = await Promise.all(
            wanted.map(async (u) => {
                let host;
                try {
                    const parsed = new URL(u);
                    if (parsed.protocol !== 'https:') return [u, undefined];
                    host = parsed.hostname;
                } catch {
                    return [u, undefined];
                }
                // Anything off the list is answered as unknown, not probed.
                if (!ALLOWED_HOSTS.includes(host)) return [u, undefined];
                return [u, await isUp(u)];
            })
        );

        const body = {};
        for (const [u, up] of results) if (up !== undefined) body[u] = up;

        return new Response(JSON.stringify(body), {
            headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
            },
        });
    },
};
