import { getPopularSearches } from '@/lib/search/popular';

// A literal, because Next.js reads the segment config statically. It matches the fetch behind it
// (`POPULAR_REVALIDATE_SECONDS` in `popular.ts`), so route and fetch expire together.
export const revalidate = 3600;

/**
 * The data of „Häufig gesucht“ for the search panel, which opens without a search term. The search
 * page reads the same data through `getPopularSearches()` directly.
 *
 * @returns The heading and the terms as JSON.
 */
export async function GET(): Promise<Response> {
	return Response.json(await getPopularSearches());
}
