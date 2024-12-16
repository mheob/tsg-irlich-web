import type { ComponentPropsWithoutRef } from 'react';

import ArrowButtonGroup from '@/components/ui/arrow-button-group';
import NewsArticlePreview from '@/components/ui/news-article-preview';
import type { NewsArticlesQueryResult } from '@/types/sanity.types';

interface LatestNewsPaginationProps extends ComponentPropsWithoutRef<'section'> {
	articles: NewsArticlesQueryResult;
}

export default function LatestNewsPagination({
	articles,
	...props
}: Readonly<LatestNewsPaginationProps>) {
	return (
		<section className="pt-10 md:pt-28" {...props}>
			<h2 className="pb-8 text-xl md:pb-14 md:text-4xl">Alles Wissenswertes</h2>

			<div className="grid gap-5 md:grid-cols-3 md:gap-10">
				{articles.map(article => (
					<NewsArticlePreview article={article} key={article._id} />
				))}
			</div>

			<div className="mt-8 md:mt-14">
				<ArrowButtonGroup />
			</div>
		</section>
	);
}
