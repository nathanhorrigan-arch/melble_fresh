# MelBurb local analytics dashboard

This local-only dashboard combines:

- website visit totals from Cloudflare Analytics;
- registration totals from Supabase Auth.

The browser page never receives either provider's secret credential. `server.mjs`
reads them from a local `.env` file and returns aggregate counts only.

## Setup

1. Copy `.env.example` to `.env`.
2. Add a Supabase secret key with server-side access to Auth users.
3. Add a Cloudflare API token restricted to account analytics read access.
4. Add the Cloudflare account ID.
5. Run `node server.mjs` and open `http://127.0.0.1:4174`.

Never upload `.env`, share its contents, or deploy this dashboard publicly.
