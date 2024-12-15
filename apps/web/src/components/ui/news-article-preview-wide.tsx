import Image from 'next/image';
import Link from 'next/link';

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
	const featuredImageSource = urlForImage(featuredImage, 422, 750);
	const authorImageSource = urlForImage(author.image, 56);

	return (
		<article className="group rounded-xl bg-white text-black md:grid md:grid-cols-[50%_50%]">
			{featuredImageSource && (
				<Link
					className="relative block aspect-[2.5/1] w-full overflow-hidden rounded-t-xl md:aspect-auto md:rounded-l-xl md:rounded-r-none"
					href={`/news/${slug}`}
				>
					<Image
						alt={featuredImage.alt}
						className="transform-cpu rounded-t-xl object-cover duration-500 group-hover:scale-110 md:rounded-l-xl md:rounded-r-none"
						sizes="(max-width: 48rem) 100vw, 800px"
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
						<div className="relative size-7 md:size-14">
							<Image
								alt={author.image.alt}
								className="rounded-full"
								sizes="(max-width: 48rem) 28px, 56px"
								src={authorImageSource}
								fill
							/>
						</div>
					)}
					<p className="text-sm md:text-xl">
						{author.firstName} {author.lastName}
					</p>
				</div>
			</div>
		</article>
	);
}
