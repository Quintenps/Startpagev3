<script lang="ts">
  import Link from "$lib/components/Link.svelte";
  import mascot from "$lib/mascots/ghastly.gif";
  import type { LinkItem } from "$lib/link-config.js";
  import H1 from "$lib/components/H1.svelte";
  import H2 from "$lib/components/H2.svelte";
  import { onMount } from "svelte";
  import Loading from "$lib/components/Loading.svelte";
  import { StartPageConfig } from "../StartPageConfig";
  import type { RssCache } from "$lib/rss-service";

  let loading: Boolean = true;
  let rssCache: RssCache;
  let links: [string, LinkItem[]][] = [];

  onMount(async () => {
    try {
      links = Object.entries(StartPageConfig.LINKS);

      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Failed to fetch data");
      rssCache = await res.json();
    } catch (err) {
      console.log("An error occured trying to fetch config");
      console.log(err);
    } finally {
      loading = false;
    }
  });

  function getMinutesAgo(lastFetched: number): string {
    const lastFetchedDate = new Date(lastFetched);
    const now = new Date();
    const differenceInMs = now.getTime() - lastFetchedDate.getTime();

    if (differenceInMs < 1000) {
      return `Just now`;
    }

    if (differenceInMs < 60_000) {
      return `${Math.floor(differenceInMs / 1000)} seconds ago`;
    }

    const minutesAgo = Math.floor(differenceInMs / (1000 * 60));
    return `${minutesAgo} minute${minutesAgo === 1 ? "" : "s"} ago`;
  }
</script>

<svelte:head>
  <title>Startpage</title>
</svelte:head>

<div class="min-h-screen flex bg-slate-200 dark:bg-slate-800">
  <div
    class="container mx-auto px-8 max-w-5xl items-center flex flex-col lg:justify-center gap-4 text-slate-800 dark:text-slate-300"
  >
    <div class="flex flex-row justify-center">
      <img src={mascot} alt="Mascot" class="max-w-24" />
    </div>
    <div class="flex flex-col w-full md:gap-8 md:flex-row">
      <div class="w-full md:w-1/3">
        <H1 text="Links" />
          {#each links as [category, linkItems]}
            <div class="my-2 md:my-0 md:mb-4">
              <H2 text={category} />
              <div class="flex flex-col md:flex-row flex-wrap gap-2">
                {#each linkItems as link}
                  <Link title={link.title} url={link.url} />
                {/each}
              </div>
            </div>
          {/each}
      </div>
      <div class="w-full md:w-2/3">
        <div class="my-2 md:my-0">
          <H1 text="RSS" />
          {#if loading}
            <Loading />
          {:else if rssCache}
            <p class="text-xs py-2">
              Last fetched: {getMinutesAgo(rssCache.lastFetched)}
            </p>
            <div class="flex flex-col flex-wrap gap-2">
              {#if rssCache}
                {#each rssCache.data.slice(0, 10) as rssItem}
                  <Link title={rssItem.title} url={rssItem.url} />
                {/each}
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
