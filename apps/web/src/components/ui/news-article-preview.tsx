import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@tsgi-web/shared';

import { urlForImage } from '@/lib/sanity/utils';
import type { NewsArticlesQueryResult } from '@/types/sanity.types';
import { getLocaleDate } from '@/utils/time';

import { badgeVariants } from './badge';
import { ARTICLE_LINK_CLASS_NAME } from './news-article-link';

const IMAGE_SIZE = { height: 450, width: 800 };

interface NewsArticlePreviewProps {
	article: NewsArticlesQueryResult[number];
	columns?: 1 | 2;
}

export function NewsArticlePreview({
	article: { author, categories, excerpt, featuredImage, publishedAt, slug, title },
	columns = 1,
}: Readonly<NewsArticlePreviewProps>) {
	const featuredImageSource = urlForImage(featuredImage, IMAGE_SIZE.height, IMAGE_SIZE.width);

	// The title is the card's one link to the article and stretches over the whole card, the image
	// included, so a keyboard meets the article once, under its title. The category links sit above
	// it (`relative z-10`) and stay links of their own.
	return (
		<article
			className={cn('group relative flex flex-col rounded-xl bg-background shadow-lg', {
				'md:grid md:grid-cols-2': columns === 2,
			})}
		>
			{featuredImageSource && (
				<div
					className={cn('relative min-h-48 flex-1 overflow-hidden rounded-t-xl', {
						'md:rounded-s-xl md:rounded-se-none': columns === 2,
					})}
				>
					<Image
						alt={featuredImage.alt}
						className="transform-cpu object-cover duration-500 group-hover:scale-110"
						sizes="(max-width: 48rem) 100vw, 800px"
						src={featuredImageSource}
						fill
					/>
				</div>
			)}

			<div className="flex flex-col gap-4 p-5">
				<div className="text-sm text-primary md:text-lg">
					<span>
						{author.firstName} {author.lastName}
					</span>
					<span className="px-3">&bull;</span>
					<time dateTime={publishedAt}>
						{columns === 2
							? getLocaleDate(new Date(publishedAt), 'short')
							: getLocaleDate(new Date(publishedAt))}
					</time>
				</div>

				<h3 className="line-clamp-2 h-[2lh] text-2xl font-bold hyphens-auto md:text-3xl">
					<Link className={ARTICLE_LINK_CLASS_NAME} href={`/news/${categories[0].slug}/${slug}`}>
						{title}
					</Link>
				</h3>

				<p className="line-clamp-3 h-[3lh] text-sm text-muted-foreground md:text-xl">{excerpt}</p>

				<div className="flex flex-wrap gap-4">
					{categories?.map((category) => (
						<Link
							className={cn(badgeVariants({ size: 'sm' }), 'relative z-10')}
							href={`/news/${category.slug}`}
							key={category.slug}
						>
							{category.title}
						</Link>
					))}
				</div>
			</div>
		</article>
	);
}
