// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { LinkConfig } from '$lib/link-config';
import type { RssItem } from '$lib/rss-service';

declare global {
	namespace App {
		interface Platform {
			env: {
				rss: string[];
				links: LinkConfig;
			};
		}
	}
}

export {};