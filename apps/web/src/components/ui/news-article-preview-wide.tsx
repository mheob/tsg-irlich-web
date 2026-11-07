import Image from 'next/image';
import Link from 'next/link';

import { urlForImage } from '@/lib/sanity/utils';
import type { NewsArticlesQueryResult } from '@/types/sanity.types';

import { ARTICLE_LINK_CLASS_NAME } from './news-article-link';
import { Portrait } from './portrait';

const FEATURED_IMAGE_SIZE = { height: 450, width: 800 };
const AUTHOR_IMAGE_SIZE = 56;

type NewsArticlePreviewWideProps = NewsArticlesQueryResult[number];

export function NewsArticlePreviewWide({
	author,
	categories,
	excerpt,
	featuredImage,
	slug,
	title,
}: Readonly<NewsArticlePreviewWideProps>) {
	const featuredImageSource = urlForImage(
		featuredImage,
		FEATURED_IMAGE_SIZE.height,
		FEATURED_IMAGE_SIZE.width,
	);

	// The title is the card's one link to the article and stretches over the whole card, the image
	// included, so a keyboard meets the article once, under its title. The category links come first
	// in the markup and need `z-10` to sit above it.
	return (
		<article className="group relative rounded-xl bg-background text-black md:grid md:grid-cols-[50%_50%]">
			{featuredImageSource && (
				<div className="relative aspect-2.5/1 w-full overflow-hidden rounded-t-xl md:aspect-auto md:rounded-t-none md:rounded-l-xl">
					<Image
						alt={featuredImage.alt}
						className="transform-cpu rounded-t-xl object-cover duration-500 group-hover:scale-110 md:rounded-t-none md:rounded-l-xl"
						sizes="(max-width: 48rem) 100vw, 800px"
						src={featuredImageSource}
						fill
					/>
				</div>
			)}

			<div className="flex flex-col justify-between gap-3 p-5 md:px-14 md:py-8">
				<div className="flex gap-6 text-sm md:text-lg">
					{categories?.map((category) => (
						<Link
							className="relative z-10 -my-0.5 py-0.5"
							href={`/news/${category.slug}`}
							key={category.slug}
						>
							{category.title}
						</Link>
					))}
				</div>
				<h3 className="line-clamp-2 text-2xl font-bold md:text-3xl">
					<Link className={ARTICLE_LINK_CLASS_NAME} href={`/news/${categories[0].slug}/${slug}`}>
						{title}
					</Link>
				</h3>
				<p className="line-clamp-3 text-sm md:text-xl">{excerpt}</p>

				<div className="flex items-center gap-3">
					<Portrait
						className="size-7 text-xs md:size-14 md:text-xl"
						firstName={author.firstName}
						image={author.image}
						lastName={author.lastName}
						sizes="(max-width: 48rem) 28px, 56px"
						sourceSize={AUTHOR_IMAGE_SIZE}
					/>
					<p className="text-sm md:text-xl">
						{author.firstName} {author.lastName}
					</p>
				</div>
			</div>
		</article>
	);
}
