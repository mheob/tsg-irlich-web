import type { Metadata } from 'next';

import { NewsOverview } from './_shared/news-overview';
import { getNewsOverviewMetadata } from './_shared/news-overview-metadata';

/*
 * The first page of the overview. It reads no search parameters, so it is prerendered and cached;
 * `next.config.ts` rewrites `/news?seite=N` to `seite/[page]`, which serves the later pages.
 */

export async function generateMetadata(): Promise<Metadata> {
	return getNewsOverviewMetadata(1);
}

export default function NewsOverviewPage() {
	return <NewsOverview currentPage={1} />;
}
