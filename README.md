# Quinten's Startpage

A personal startpage built from static HTML, CSS, and JavaScript, with a Cloudflare Pages Function for RSS feeds.

## Features

- Configurable link groups and RSS feeds
- Light and dark themes following the system preference
- Latest 10 RSS stories with manual refresh, 15-minute success caching, and stale fallback during feed outages
- Responsive layout and graceful RSS failure state
- Deployable to Cloudflare Pages

## Configure

Edit `public/config.js` to change the links or RSS feed URLs. The same configuration is used by the browser page and the RSS Function.

## Develop

Install dependencies and run the Pages local emulator:

```sh
npm install
npm run dev
```

Run syntax checks and the focused RSS/build-validation tests with:

```sh
npm run check
npm test
npm run build
```

RSS feed URLs are restricted to HTTP and HTTPS, and responses larger than 1 MiB are ignored. Successful results are cached for 15 minutes; after a complete feed outage, the last successful results are served as stale for up to seven days, and failures are briefly cached to avoid repeated upstream requests.

## Deploy

For Cloudflare Pages Git integration, use `npm run build` as the build command and `public` as the build output directory. The `functions/` directory is detected automatically.

For Wrangler deployment, authenticate once and run:

```sh
npm run pages:deploy
```

## Dependencies

- `fast-xml-parser` parses RSS and Atom XML in the Pages Function; Cloudflare Workers do not provide a general-purpose XML DOM parser.
- `wrangler` provides the local Pages runtime and deployment command.
- The Wrangler dependency tree pins `undici` to a patched release.

The browser UI uses native HTML, CSS, and JavaScript without a framework runtime or bundler.