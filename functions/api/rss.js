import { XMLParser } from "fast-xml-parser";
import { config } from "../../public/config.js";

const cacheTtlSeconds = 15 * 60;
const failureCacheTtlSeconds = 30;
const staleCacheTtlSeconds = 7 * 24 * 60 * 60;
export const maxFeedBytes = 1024 * 1024;
const xmlParser = new XMLParser({ ignoreAttributes: false });
let memoryCache;
let staleMemoryCache;
let failureMemoryCache;

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function textValue(value) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (value && typeof value["#text"] === "string") return value["#text"].trim();
  return "";
}

function linkValue(value) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    const link = value.find((candidate) => candidate?.["@_rel"] === "alternate") ?? value[0];
    return linkValue(link);
  }
  if (value && typeof value["@_href"] === "string") return value["@_href"].trim();
  return textValue(value);
}

export function normalizeFeedUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

async function responseText(response) {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxFeedBytes) {
    throw new Error("Feed response exceeded the size limit");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > maxFeedBytes) {
      throw new Error("Feed response exceeded the size limit");
    }
    return text;
  }

  const decoder = new TextDecoder();
  let byteLength = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > maxFeedBytes) {
        await reader.cancel();
        throw new Error("Feed response exceeded the size limit");
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

export async function fetchFeed(value, fetchImplementation = fetch) {
  const url = normalizeFeedUrl(value);
  if (!url) throw new Error("Feed URL must use http or https");
  const source = new URL(url).hostname.replace(/^www\./, "");

  const response = await fetchImplementation(url, {
    headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Feed returned ${response.status}: ${url}`);

  const xml = xmlParser.parse(await responseText(response));
  let items;
  if (xml.rss?.channel) items = xml.rss.channel.item;
  else if (xml["rdf:RDF"]) items = xml["rdf:RDF"].item;
  else if (xml.feed) items = xml.feed.entry;
  else throw new Error(`Feed did not contain RSS or Atom XML: ${url}`);

  return asArray(items).map((item) => ({
    title: textValue(item.title),
    url: linkValue(item.link),
    pubDate: textValue(item.pubDate ?? item.published ?? item.updated),
    source,
  })).filter((item) => item.title && item.url);
}

function storyUrlKey(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.href;
  } catch {
    return String(value).trim();
  }
}

export function mergeStories(feeds) {
  const stories = feeds.flat();
  stories.sort((first, second) => {
    const firstDate = Date.parse(first.pubDate);
    const secondDate = Date.parse(second.pubDate);
    return (Number.isNaN(secondDate) ? 0 : secondDate) - (Number.isNaN(firstDate) ? 0 : firstDate);
  });

  const seen = new Set();
  return stories.filter((story) => {
    const key = storyUrlKey(story.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
}

export function withStaleFallback(result, staleResult) {
  if (!result.unavailable) return { ...result, stale: false };
  if (staleResult && Array.isArray(staleResult.data)) {
    return {
      ...staleResult,
      unavailable: true,
      stale: true,
      failedFeeds: result.failedFeeds ?? [],
    };
  }
  return { ...result, stale: false };
}

export async function fetchAllFeeds(feedUrls = config.rssFeeds, fetchImplementation = fetch) {
  const urls = Array.isArray(feedUrls) ? feedUrls.map(normalizeFeedUrl).filter(Boolean) : [];
  const results = await Promise.allSettled(urls.map((url) => fetchFeed(url, fetchImplementation)));
  const successfulFeeds = results.filter((result) => result.status === "fulfilled").length;
  const failedFeeds = results.flatMap((result, index) => {
    if (result.status !== "rejected") return [];
    const error = result.reason instanceof Error ? result.reason.message : String(result.reason);
    return [{ url: urls[index], error }];
  });
  const data = mergeStories(results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []));

  return {
    lastFetched: Date.now(),
    data,
    failedFeeds,
    unavailable: successfulFeeds === 0,
    stale: false,
  };
}

function jsonResponse(body, maxAgeSeconds = 0) {
  const payload = Array.isArray(body?.data) && !Array.isArray(body.failedFeeds)
    ? { ...body, failedFeeds: [] }
    : body;
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": maxAgeSeconds > 0 ? `public, max-age=${maxAgeSeconds}` : "no-store",
    },
  });
}

function cacheKey(request, variant) {
  const url = new URL(request.url);
  url.searchParams.set("__rss_cache", variant);
  return new Request(url);
}

async function readCache(cache, key, label) {
  if (!cache) return null;
  try {
    const response = await cache.match(key);
    if (!response) return null;
    const result = await response.json();
    return Array.isArray(result.data) ? result : null;
  } catch (error) {
    console.warn(`Cloudflare ${label} cache lookup failed`, error);
    return null;
  }
}

async function writeCache(cache, key, response, waitUntil, label) {
  if (!cache) return;
  const write = cache.put(key, response).catch((error) => {
    console.warn(`Cloudflare ${label} cache write failed`, error);
  });
  if (typeof waitUntil === "function") waitUntil(write);
  else await write;
}

async function staleResultFor(cache, request, now) {
  if (staleMemoryCache && staleMemoryCache.expiresAt > now) return staleMemoryCache.result;
  const cached = await readCache(cache, cacheKey(request, "stale-v1"), "stale");
  if (cached) {
    staleMemoryCache = { result: cached, expiresAt: cached.lastFetched + staleCacheTtlSeconds * 1000 };
  }
  return cached;
}

export async function onRequestGet({ request, waitUntil }) {
  const now = Date.now();
  if (memoryCache && now - memoryCache.lastFetched < cacheTtlSeconds * 1000) {
    return jsonResponse(memoryCache, cacheTtlSeconds);
  }

  const edgeCache = globalThis.caches?.default;
  const primaryKey = new Request(new URL("/api/rss", request.url));
  const staleKey = cacheKey(request, "stale-v1");
  const failureKey = cacheKey(request, "failure-v1");
  if (edgeCache) {
    const cached = await readCache(edgeCache, primaryKey, "success");
    if (cached) {
      memoryCache = cached;
      staleMemoryCache = { result: cached, expiresAt: cached.lastFetched + staleCacheTtlSeconds * 1000 };
      return jsonResponse(cached, cacheTtlSeconds);
    }
  }

  if (failureMemoryCache && now - failureMemoryCache.lastFailed < failureCacheTtlSeconds * 1000) {
    return jsonResponse(failureMemoryCache.result);
  }
  const cachedFailure = await readCache(edgeCache, failureKey, "failure");
  if (cachedFailure) return jsonResponse(cachedFailure);

  const result = await fetchAllFeeds();
  if (!result.unavailable) {
    memoryCache = result;
    failureMemoryCache = null;
    staleMemoryCache = { result, expiresAt: result.lastFetched + staleCacheTtlSeconds * 1000 };
    await writeCache(edgeCache, primaryKey, jsonResponse(result, cacheTtlSeconds), waitUntil, "success");
    await writeCache(edgeCache, staleKey, jsonResponse(result, staleCacheTtlSeconds), waitUntil, "stale");
    if (edgeCache) {
      const deletion = edgeCache.delete(failureKey).catch((error) => {
        console.warn("Cloudflare failure cache clear failed", error);
      });
      if (typeof waitUntil === "function") waitUntil(deletion);
      else await deletion;
    }
    return jsonResponse(result, cacheTtlSeconds);
  }

  const staleResult = await staleResultFor(edgeCache, request, now);
  const failedResult = withStaleFallback(result, staleResult);
  failureMemoryCache = { lastFailed: now, result: failedResult };
  await writeCache(edgeCache, failureKey, jsonResponse(failedResult, failureCacheTtlSeconds), waitUntil, "failure");
  return jsonResponse(failedResult);
}