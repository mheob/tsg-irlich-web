'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useMediaQuery } from '@/hooks/use-media-query';
import { urlForImage } from '@/lib/sanity/utils';
import type { HomePageNewsQueryResult } from '@/types/sanity.types';

type NewsArticlePreviewWideProps = HomePageNewsQueryResult[0];

export default function NewsArticlePreviewWide({
	author,
	categories,
	excerpt,
	featuredImage,
	slug,
	title,
}: Readonly<NewsArticlePreviewWideProps>) {
	const isDesktop = useMediaQuery('(min-width: 48rem)');

	const featuredImageSource = isDesktop
		? urlForImage(featuredImage, 480, 800)
		: urlForImage(featuredImage, 267, 350);
	const authorImageSource = isDesktop
		? urlForImage(author.image, 56)
		: urlForImage(author.image, 28);

	return (
		<article className="group rounded-xl bg-white text-black md:grid md:grid-cols-[50%_50%]">
			{featuredImageSource && (
				<Link
					className="overflow-hidden rounded-t-xl md:rounded-l-xl md:rounded-r-none"
					href={`/news/${slug}`}
				>
					<Image
						alt={featuredImage.alt}
						className="transform-cpu rounded-t-xl duration-500 group-hover:scale-110 md:rounded-l-xl md:rounded-r-none"
						sizes="(min-width: 48rem) 800px, 350px"
						src={featuredImageSource}
						fill
					/>
				</Link>
			)}

			<div className="flex flex-col justify-between gap-3 p-5 md:px-14 md:py-8">
				<p className="flex gap-6 text-sm md:text-lg">
					{categories?.map(category => (
						<Link href={category.slug} key={category.slug}>
							{category.title}
						</Link>
					))}
				</p>
				<h3 className="line-clamp-2 text-2xl font-bold md:text-3xl">
					<Link href={`/news/${slug}`}>{title}</Link>
				</h3>
				<p className="line-clamp-3 text-sm md:text-xl">{excerpt}</p>

				<div className="flex items-center gap-3">
					{authorImageSource && (
						<Image
							alt={author.image.alt}
							className="rounded-full"
							height={isDesktop ? 56 : 28}
							src={authorImageSource}
							width={isDesktop ? 56 : 28}
						/>
					)}
					<p className="text-sm md:text-xl">
						{author.firstName} {author.lastName}
					</p>
				</div>
			</div>
		</article>
	);
}
