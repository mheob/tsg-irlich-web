import { client } from '@/lib/sanity/client';
import { newsArticlesPaginatedQuery } from '@/lib/sanity/queries/shared/news';

interface FetchNextPageParams {
	lastId?: string;
	lastUpdatedAt?: string;
}

export async function fetchNextPage({ lastId, lastUpdatedAt }: FetchNextPageParams) {
	if (!lastId || !lastUpdatedAt) {
		return [];
	}

	const result = await client.fetch(newsArticlesPaginatedQuery, { lastId, lastUpdatedAt });

	if (result.length > 0) {
		lastUpdatedAt = result.at(-1)?._updatedAt;
		lastId = result.at(-1)?._id;
	} else {
		lastId = undefined; // Reached the end
	}

	return [result, { lastId, lastUpdatedAt }];
}
