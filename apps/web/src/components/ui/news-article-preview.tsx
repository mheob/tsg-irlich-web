import { cn } from '@tsgi-web/shared';
import Image from 'next/image';
import Link from 'next/link';

import { urlForImage } from '@/lib/sanity/utils';
import type { NewsArticlesQueryResult } from '@/types/sanity.types';
import { getLocaleDate } from '@/utils/time';

import { badgeVariants } from './badge';

interface NewsArticlePreviewProps {
	article: NewsArticlesQueryResult[0];
	columns?: 1 | 2;
}

export function NewsArticlePreview({
	article: { author, categories, excerpt, featuredImage, publishedAt, slug, title },
	columns = 1,
}: Readonly<NewsArticlePreviewProps>) {
	const featuredImageSource = urlForImage(featuredImage, 450, 800);

	return (
		<article
			className={cn('bg-background group flex flex-col rounded-xl shadow-lg', {
				'md:grid md:grid-cols-2': columns === 2,
			})}
		>
			{featuredImageSource && (
				<Link
					className={cn('relative block min-h-48 flex-1 overflow-hidden rounded-t-xl', {
						'md:rounded-s-xl md:rounded-se-none': columns === 2,
					})}
					href={`/news/${categories[0].slug}/${slug}`}
				>
					<Image
						alt={featuredImage.alt}
						className="transform-cpu object-cover duration-500 group-hover:scale-110"
						sizes="(max-width: 48rem) 100vw, 800px"
						src={featuredImageSource}
						fill
					/>
				</Link>
			)}

			<div className="flex flex-col gap-4 p-5">
				<div className="text-primary text-sm md:text-lg">
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

				<Link href={`/news/${categories[0].slug}/${slug}`}>
					<h2 className="line-clamp-2 h-[2lh] hyphens-auto text-2xl font-bold md:text-3xl">
						{title}
					</h2>
				</Link>

				<p className="text-muted-foreground line-clamp-3 h-[3lh] text-sm md:text-xl">{excerpt}</p>

				<div className="flex gap-4">
					{categories?.map(category => (
						<Link
							className={badgeVariants({ size: 'sm' })}
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
