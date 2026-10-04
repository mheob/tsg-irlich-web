import { ArrowButtonGroup } from '@/components/ui/arrow-button';
import { NewsArticleGrid } from '@/components/ui/news-article-grid';
import type { NewsArticlesQueryResult } from '@/types/sanity.types';

interface LatestNewsPaginationProps {
	articles: NewsArticlesQueryResult;
	currentPage: number;
	hasNextPage?: boolean;
}

export function LatestNewsPagination({
	articles,
	currentPage,
	hasNextPage = false,
}: Readonly<LatestNewsPaginationProps>) {
	return (
		<>
			<NewsArticleGrid articles={articles} />

			{(hasNextPage || currentPage > 1) && (
				<div className="mt-8 lg:mt-14">
					<ArrowButtonGroup
						hrefNext={`?seite=${currentPage + 1}`}
						hrefPrev={`?seite=${currentPage - 1}`}
						isDisabledNext={!hasNextPage}
						isDisabledPrevious={currentPage === 1}
						type="link"
					/>
				</div>
			)}
		</>
	);
}
