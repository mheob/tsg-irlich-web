import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

import { badgeVariants } from '@/components/ui/badge';
import type { NewsArticleContentQueryResult } from '@/types/sanity.types';

interface CategoriesProps extends ComponentPropsWithoutRef<'section'> {
	article: Pick<NonNullable<NewsArticleContentQueryResult>, 'categories'>;
}

export function Categories({ article, ...props }: Readonly<CategoriesProps>) {
	return (
		<section className="mt-10" {...props}>
			<h2 className="text-2xl font-bold uppercase">Kategorien</h2>

			<div className="mt-3 flex flex-wrap items-center gap-4">
				{article.categories?.map((category) => (
					<Link className={badgeVariants()} href={`/news/${category.slug}`} key={category.slug}>
						{category.title}
					</Link>
				))}
			</div>
		</section>
	);
}
