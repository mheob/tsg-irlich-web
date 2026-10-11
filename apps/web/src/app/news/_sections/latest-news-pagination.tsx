import { NewsArticleGrid } from '@/components/ui/news-article-grid';
import { OverviewPagination } from '@/components/ui/pagination';
import type { NewsArticlesQueryResult } from '@/types/sanity.types';

interface LatestNewsPaginationProps {
	articles: NewsArticlesQueryResult;
	basePath: string;
	currentPage: number;
	perPage: number;
	startIndex: number;
	totalArticles: number;
}

export function LatestNewsPagination({
	articles,
	basePath,
	currentPage,
	perPage,
	startIndex,
	totalArticles,
}: Readonly<LatestNewsPaginationProps>) {
	return (
		<>
			<NewsArticleGrid articles={articles} />

			<OverviewPagination
				basePath={basePath}
				className="mt-8 lg:mt-14"
				currentPage={currentPage}
				itemLabel="Artikel"
				perPage={perPage}
				startIndex={startIndex}
				totalItems={totalArticles}
			/>
		</>
	);
}
