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
	const featuredImageSource = urlForImage(featuredImage, 480, 800);
	const authorImageSource = urlForImage(author.image, 56);

	return (
		<article className="group grid grid-cols-[50%,50%] rounded-xl bg-white text-black">
			{featuredImageSource && (
				<Link className="overflow-hidden rounded-l-xl" href={`/news/${slug}`}>
					<Image
						alt={featuredImage.alt}
						className="transform-cpu duration-500 group-hover:scale-110"
						height={450}
						src={featuredImageSource}
						width={800}
					/>
				</Link>
			)}

			<div className="flex flex-col justify-between gap-2 px-14 py-8">
				<p className="flex gap-6 text-lg">
					{categories?.map(category => (
						<Link href={category.slug} key={category.slug}>
							{category.title}
						</Link>
					))}
				</p>
				<h3 className="line-clamp-2 text-3xl font-bold">
					<Link href={`/news/${slug}`}>{title}</Link>
				</h3>
				<p className="line-clamp-3 text-xl">{excerpt}</p>

				<div className="flex items-center gap-3">
					{authorImageSource && (
						<Image
							alt={author.image.alt}
							className="rounded-full"
							height={56}
							src={authorImageSource}
							width={56}
						/>
					)}
					<p className="text-xl">
						{author.firstName} {author.lastName}
					</p>
				</div>
			</div>
		</article>
	);
}
