import type { ComponentPropsWithoutRef } from 'react';

import NewsArticlePreview from '@/components/ui/news-article-preview';
import type { NewsArticlesQueryResult } from '@/types/sanity.types';

interface LatestNewsProps extends ComponentPropsWithoutRef<'section'> {
	articles: NewsArticlesQueryResult;
}

export default function LatestNews({ articles, ...props }: Readonly<LatestNewsProps>) {
	return (
		<section className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-10" {...props}>
			<NewsArticlePreview article={articles[0]} key={articles[0]._id} />

			<div className="flex flex-col gap-5 md:gap-10">
				{articles.slice(1).map(article => (
					<NewsArticlePreview article={article} columns={2} key={article._id} />
				))}
			</div>
		</section>
	);
}
