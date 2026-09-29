import { NewsArticlePreview } from '@/components/ui/news-article-preview';
import type { NewsArticlesQueryResult } from '@/types/sanity.types';

interface NewsArticleGridProps {
	articles: NewsArticlesQueryResult;
}

export function NewsArticleGrid({ articles }: Readonly<NewsArticleGridProps>) {
	return (
		<div className="grid gap-5 md:grid-cols-2 md:gap-10 lg:grid-cols-3">
			{articles.map((article) => (
				<NewsArticlePreview article={article} key={article._id} />
			))}
		</div>
	);
}
