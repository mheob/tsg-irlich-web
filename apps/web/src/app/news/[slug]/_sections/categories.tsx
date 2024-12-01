import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

import type { NewsArticleContentQueryResult } from '@/types/sanity.types';

interface CategoriesProps extends ComponentPropsWithoutRef<'section'> {
	article: NonNullable<NewsArticleContentQueryResult>;
}

export default function Categories({ article, ...props }: Readonly<CategoriesProps>) {
	return (
		<section className="mt-10" {...props}>
			<h2 className="text-2xl font-bold uppercase">Kategorien</h2>

			<div className="mt-3 flex items-center gap-4">
				{/* // FIXME: get ALL news categories and highlight the current categories */}
				{article.categories?.map(category => (
					<Link
						className="bg-secondary hover:bg-secondary/80 rounded-2xl px-6 py-2"
						href={`/news/${category.slug}`}
						key={category.slug}
					>
						{category.title}
					</Link>
				))}
			</div>
		</section>
	);
}
