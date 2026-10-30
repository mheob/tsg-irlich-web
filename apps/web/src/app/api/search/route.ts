import type { NextRequest } from 'next/server';

import { PANEL_HITS_PER_GROUP } from '@/lib/search/constants';
import { searchSite } from '@/lib/search/search-site';

/**
 * The data source of the search panel: the first hits of both groups for `?q=`, and the totals the
 * „Alle … anzeigen“ links need. Without a usable search term (missing, too short, nothing but
 * operators or punctuation) the answer is `null`, which the panel reads as „show Häufig gesucht“,
 * and nothing reaches Sanity.
 *
 * @param request - The request.
 * @returns The `SearchResult` as JSON, or `null`.
 */
export async function GET(request: NextRequest): Promise<Response> {
	const query = request.nextUrl.searchParams.get('q') ?? '';
	const result = await searchSite(query, { perGroup: PANEL_HITS_PER_GROUP });

	return Response.json(result ?? null);
}
