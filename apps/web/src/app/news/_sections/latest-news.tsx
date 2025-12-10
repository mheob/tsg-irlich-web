import type { ComponentPropsWithoutRef } from 'react';

import { NewsArticlePreview } from '@/components/ui/news-article-preview';
import type { NewsArticlesQueryResult } from '@/types/sanity.types';

interface LatestNewsProps extends ComponentPropsWithoutRef<'section'> {
	articles: NewsArticlesQueryResult;
}

export function LatestNews({ articles, ...props }: Readonly<LatestNewsProps>) {
	return (
		<section className="mt-8 grid grid-cols-1 gap-5 lg:mt-14 lg:grid-cols-2 lg:gap-10" {...props}>
			<NewsArticlePreview article={articles[0]} />

			<div className="flex flex-col gap-5 lg:gap-10">
				{articles.slice(1).map(article => (
					<NewsArticlePreview article={article} columns={2} key={article._id} />
				))}
			</div>
		</section>
	);
}
