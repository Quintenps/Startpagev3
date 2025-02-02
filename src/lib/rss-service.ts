import { XMLParser } from "fast-xml-parser";

export type RssItem = {
  title: string;
  url: string;
  pubDate: string;
};

export interface RssCache {
  lastFetched: number;
  data: RssItem[];
}

let cache: RssCache = {
  lastFetched: 0,
  data: [],
};

async function fetchRssFeed(rssUrls: string[]): Promise<void> {
  const fetchedData: RssItem[] = (
    await Promise.all(
      rssUrls.map(async (url) => {
        return await fetchRSSFeed(url);
      })
    )
  ).flat();

  fetchedData.sort((a: RssItem, b: RssItem) => {
    const c = new Date(a.pubDate).getTime();
    const d = new Date(b.pubDate).getTime();
    return d - c;
  });

  cache = {
    lastFetched: Date.now(),
    data: fetchedData,
  };
}

async function fetchRSSFeed(url: string): Promise<RssItem[]> {
  try {
    const response = await fetch(url);
    const text = await response.text();

    const parser = new XMLParser({ ignoreAttributes: false });
    const xmlObj = parser.parse(text);
    const items = xmlObj.rss?.channel?.item ?? [];

    return items.map((item: any) => ({
        title: item.title ?? "",
        url: item.link ?? "",
        pubDate: item.pubDate ?? ""
    }));

  } catch (error) {
    console.error("Error fetching RSS feed:", error);
    return [];
  }
}

export async function getCachedRssFeed(rssUrls: string[]): Promise<RssCache> {
  const fifteenMinutes = 15 * 60 * 1000;
  if (Date.now() - cache.lastFetched > fifteenMinutes) {
    await fetchRssFeed(rssUrls);
  }

  return cache;
}
