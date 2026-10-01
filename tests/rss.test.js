import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchFeed,
  fetchAllFeeds,
  maxFeedBytes,
  mergeStories,
  normalizeFeedUrl,
  onRequestGet,
  withStaleFallback,
} from "../functions/api/rss.js";

const feedUrl = "https://feeds.example.test/news.xml";
const xml = (items) => `<rss><channel>${items.map((item) => (
  `<item><title>${item.title}</title><link>${item.url}</link><pubDate>${item.pubDate}</pubDate></item>`
)).join("")}</channel></rss>`;
const story = (id, pubDate = "2026-09-29T10:00:00Z") => ({
  title: `Story ${id}`,
  url: `https://news.example.test/${id}`,
  pubDate,
});

test("feed URL validation accepts only HTTP and HTTPS", () => {
  assert.equal(normalizeFeedUrl("https://example.test/feed"), "https://example.test/feed");
  assert.equal(normalizeFeedUrl("http://example.test/feed"), "http://example.test/feed");
  assert.equal(normalizeFeedUrl("file:///etc/passwd"), null);
  assert.equal(normalizeFeedUrl("not a URL"), null);
  assert.equal(normalizeFeedUrl(null), null);
});

test("feed requests identify the application with a descriptive User-Agent", async () => {
  let requestOptions;
  await fetchFeed(feedUrl, async (_url, options) => {
    requestOptions = options;
    return new Response(xml([{
      title: "Header test",
      url: "https://news.example.test/header-test",
      pubDate: "",
    }]));
  });

  assert.equal(
    requestOptions.headers["User-Agent"],
    "Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.26 Mobile/15E148 Safari/604.1",
  );
});

test("invalid feed entries do not prevent valid feeds from loading", async () => {
  const calls = [];
  const result = await fetchAllFeeds(["not a URL", "file:///etc/passwd", feedUrl], async (url) => {
    calls.push(url);
    return new Response(xml([{ title: "Available", url: "https://news.example.test/1", pubDate: "" }]));
  });

  assert.deepEqual(calls, [feedUrl]);
  assert.equal(result.unavailable, false);
  assert.equal(result.data[0].title, "Available");
  assert.equal(result.data[0].source, "feeds.example.test");
});

test("partial feed failure retains successful stories", async () => {
  const result = await fetchAllFeeds([feedUrl, "https://feeds.example.test/down.xml"], async (url) => {
    if (url.endsWith("down.xml")) return new Response("", { status: 502 });
    return new Response(xml([{ title: "Available", url: "https://news.example.test/1", pubDate: "" }]));
  });

  assert.equal(result.unavailable, false);
  assert.equal(result.data.length, 1);
  assert.deepEqual(result.failedFeeds, [{
    url: "https://feeds.example.test/down.xml",
    error: "Feed returned 502: https://feeds.example.test/down.xml",
  }]);
});

test("oversized feed responses are rejected before XML parsing", async () => {
  const result = await fetchAllFeeds([feedUrl], async () => (
    new Response("x".repeat(maxFeedBytes + 1))
  ));

  assert.equal(result.unavailable, true);
  assert.deepEqual(result.data, []);
});

test("story URLs are deduplicated after date sorting and output is limited to ten", () => {
  const duplicateOlder = { ...story("duplicate", "2026-09-28T10:00:00Z"), url: "https://NEWS.example.test/duplicate#feed" };
  const duplicateNewer = { ...story("duplicate", "2026-09-30T10:00:00Z"), url: "https://news.example.test/duplicate" };
  const stories = mergeStories([
    [duplicateOlder, ...Array.from({ length: 11 }, (_, index) => story(index))],
    [duplicateNewer],
  ]);

  assert.equal(stories.length, 10);
  assert.equal(stories.filter((item) => item.url.includes("duplicate")).length, 1);
  assert.equal(stories[0].title, "Story duplicate");
  assert.equal(stories[0].pubDate, "2026-09-30T10:00:00Z");
});

test("complete feed failure preserves stale stories and marks them unavailable", async () => {
  const failed = await fetchAllFeeds([feedUrl], async () => new Response("", { status: 503 }));
  const saved = { lastFetched: 123, data: [story("saved")], unavailable: false, stale: false };
  const result = withStaleFallback(failed, saved);

  assert.equal(result.unavailable, true);
  assert.equal(result.stale, true);
  assert.deepEqual(result.data, saved.data);
  assert.equal(result.lastFetched, saved.lastFetched);
  assert.deepEqual(result.failedFeeds, [{
    url: feedUrl,
    error: `Feed returned 503: ${feedUrl}`,
  }]);
});

test("endpoint caches total failures briefly after returning stale data", async () => {
  const originalFetch = globalThis.fetch;
  const originalDateNow = Date.now;
  const originalCaches = globalThis.caches;
  const hadCaches = Object.hasOwn(globalThis, "caches");
  let now = 1_800_000_000_000;
  let calls = 0;
  Date.now = () => now;
  delete globalThis.caches;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) {
      return new Response(xml([{ title: "Saved", url: "https://news.example.test/saved", pubDate: "" }]));
    }
    return new Response("", { status: 503 });
  };

  try {
    const request = new Request("https://startpage.example.test/api/rss");
    const first = await (await onRequestGet({ request })).json();
    assert.equal(first.data[0].title, "Saved");
    assert.equal(calls, 3);
    const cached = await (await onRequestGet({ request })).json();
    assert.equal(cached.data[0].title, "Saved");
    assert.equal(calls, 3);

    now += 15 * 60 * 1000 + 1;
    const failedResponse = await onRequestGet({ request });
    const failed = await failedResponse.json();
    assert.equal(failed.unavailable, true);
    assert.equal(failed.stale, true);
    assert.equal(failed.data[0].title, "Saved");
    assert.equal(failedResponse.headers.get("cache-control"), "no-store");
    assert.equal(calls, 6);

    await onRequestGet({ request });
    assert.equal(calls, 6);
  } finally {
    globalThis.fetch = originalFetch;
    Date.now = originalDateNow;
    if (hadCaches) globalThis.caches = originalCaches;
  }
});