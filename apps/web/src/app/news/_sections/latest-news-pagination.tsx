import { ArrowButtonGroup } from '@/components/ui/arrow-button';
import { NewsArticlePreview } from '@/components/ui/news-article-preview';
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
			<div className="grid gap-5 md:grid-cols-2 md:gap-10 lg:grid-cols-3">
				{articles.map(article => (
					<NewsArticlePreview article={article} key={article._id} />
				))}
			</div>

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
