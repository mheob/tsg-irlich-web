import Image from 'next/image';
import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

import { Button } from '@/components/ui/button';
import { urlForImage } from '@/lib/sanity/utils';
import type { NewsArticleContentQueryResult } from '@/types/sanity.types';
import { getLocaleDate } from '@/utils/time';

interface AuthorProps extends ComponentPropsWithoutRef<'section'> {
	article: NonNullable<NewsArticleContentQueryResult>;
}

export function Author({ article, ...props }: Readonly<AuthorProps>) {
	const authorImageSource = urlForImage(article.author.image, 64);

	return (
		<section {...props}>
			<h2 className="text-2xl font-bold uppercase">Autor</h2>

			<div className="mt-3 flex items-center gap-4">
				{authorImageSource && (
					// TODO: use shadcn's Avatar component
					<Image
						alt={article.author.image.alt}
						className="rounded-full"
						height={64}
						src={authorImageSource}
						width={64}
					/>
				)}

				<div className="flex flex-col gap-2">
					<div className="text-xl font-bold">
						{article.author.firstName} {article.author.lastName}
					</div>

					<time dateTime={article.publishedAt}>{getLocaleDate(new Date(article.publishedAt))}</time>
				</div>
			</div>

			<Button className="mt-6" variant="secondary" asChild>
				<Link href={`mailto:${article.author.email}`}>Autor anschreiben</Link>
			</Button>
		</section>
	);
}
