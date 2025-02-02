import type { LinkConfig } from "$lib/link-config";
import {
  getCachedRssFeed,
  type RssCache,
} from "$lib/rss-service";
import { type RequestHandler } from "@sveltejs/kit";
import { StartPageConfig } from "../../../StartPageConfig";

export type Config = {
  links: LinkConfig;
  rss: RssCache;
};

export const GET: RequestHandler = async (event) => {
  try {
    const config: Config = {
      links: StartPageConfig.LINKS,
      rss: await getCachedRssFeed(StartPageConfig.RSS_FEEDS),
    };

    return new Response(JSON.stringify(config), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching cached RSS feeds:", error);
    return new Response(
      JSON.stringify({ error: `Failed to fetch RSS feeds - ${error}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
