import Image from 'next/image';
import type { ComponentPropsWithoutRef } from 'react';

import { ButtonLink } from '@/components/ui/button';
import { ContactLink } from '@/components/with-logic/contact-link';
import { urlForImage } from '@/lib/sanity/utils';
import type { NewsArticleContentQueryResult } from '@/types/sanity.types';
import { getLastModified, getLocaleDate } from '@/utils/time';

const AUTHOR_IMAGE_SIZE = 64;

interface AuthorProps extends ComponentPropsWithoutRef<'section'> {
	article: Pick<
		NonNullable<NewsArticleContentQueryResult>,
		'_updatedAt' | 'author' | 'publishedAt'
	>;
}

export function Author({ article, ...props }: Readonly<AuthorProps>) {
	const authorImageSource = urlForImage(article.author.image, AUTHOR_IMAGE_SIZE);
	const publishedDate = getLocaleDate(new Date(article.publishedAt));
	const lastModified = getLastModified(article.publishedAt, article._updatedAt);
	const lastModifiedDate = getLocaleDate(new Date(lastModified));

	return (
		<section {...props}>
			<h2 className="text-2xl font-bold uppercase">Autor</h2>

			<div className="mt-3 flex items-center gap-4">
				{authorImageSource && (
					// oxlint-disable-next-line no-warning-comments
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

					<time dateTime={article.publishedAt}>{publishedDate}</time>

					{/* A change on the day of publication is part of publishing it, not an update. */}
					{lastModifiedDate !== publishedDate && (
						<div className="text-sm text-muted-foreground">
							Aktualisiert am <time dateTime={lastModified}>{lastModifiedDate}</time>
						</div>
					)}
				</div>
			</div>

			<ButtonLink
				className="mt-6"
				render={<ContactLink href={`mailto:${article.author.email}`} />}
				variant="secondary"
			>
				Autor anschreiben
			</ButtonLink>
		</section>
	);
}
