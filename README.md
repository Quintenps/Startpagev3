# Quinten's Startpage

A lightweight personal dashboard for the browser start page, built with plain HTML, CSS, and JavaScript. It combines a small set of curated links with the latest RSS headlines and a local time display.

## Features

- Configurable link groups in `public/config.js`
- RSS feed reader for the latest stories, capped at 10 items
- Manual refresh button with a friendly fallback state for outages
- Local time and date display in the header
- Theme selector with `Auto`, `Light`, and `Night` modes
- Static app served through Cloudflare Pages, with the RSS API in `functions/api/rss.js`

## Quick start

Install dependencies and start the local Pages server:

```sh
npm install
npm run dev
```

Then open the local URL printed by Wrangler.

## Configure

Update `public/config.js` to change the link groups and RSS feed sources.

```js
export const config = {
  rssFeeds: ["https://example.com/feed.xml"],
  links: {
    work: [{ url: "https://example.com", title: "Example" }],
  },
};
```

The same config powers both the front-end and the server-side RSS function.

## Validation and local checks

```sh
npm run check
npm test
npm run build
```

The app enforces a few safety checks for RSS data:

- only `http:` and `https:` URLs are accepted
- feed responses larger than 1 MiB are ignored
- successful results are cached for 15 minutes
- stale cached stories are served after outages for up to seven days
- failed requests are briefly cached to reduce repeated upstream fetches

## Deploy

For Cloudflare Pages, use:

- build command: `npm run build`
- output directory: `public`

For direct Wrangler deployment:

```sh
npm run pages:deploy
```

## Notes

- `fast-xml-parser` is used to parse RSS and Atom XML in the Pages Function.
- `wrangler` provides the local Pages runtime and deployment tooling.
- The UI intentionally avoids framework dependencies and bundlers.