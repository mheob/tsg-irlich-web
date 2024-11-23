import Image from 'next/image';
import Link from 'next/link';

interface NewsArticlePreviewWideProps {
	author: {
		firstName: string;
		// image: SanityImage;
		imageSrc: string;
		lastName: string;
	};
	categories: {
		slug: string;
		title: string;
	}[];
	excerpt: string;
	// featuredImage: SanityImage;
	featuredImageSrc: string;
	slug: string;
	title: string;
}

export default function NewsArticlePreviewWide({
	author,
	categories,
	excerpt,
	featuredImageSrc,
	slug,
	title,
}: Readonly<NewsArticlePreviewWideProps>) {
	return (
		<article className="group grid grid-cols-[50%,50%] rounded-xl bg-white text-black">
			<a className="overflow-hidden rounded-l-xl" href={slug}>
				<Image
					// alt={featuredImage.alt as string}
					alt={title}
					className="transform-cpu duration-500 group-hover:scale-110"
					height={450}
					// src={urlFor(featuredImage, 450, 800).url()}
					src={featuredImageSrc}
					width={800}
				/>
			</a>

			<div className="flex flex-col justify-between gap-2 px-14 py-8">
				<p className="flex gap-6 text-lg">
					{categories.map(category => (
						<Link href={category.slug} key={category.slug}>
							{category.title}
						</Link>
					))}
				</p>
				<h3 className="line-clamp-2 text-3xl font-bold">
					<a href={slug}>{title}</a>
				</h3>
				<p className="line-clamp-3 text-xl">{excerpt}</p>

				<div className="flex items-center gap-3">
					<Image
						// alt={author.image.alt as string}
						alt={author.lastName}
						className="rounded-full"
						height={56}
						// src={urlFor(author.image, 56).url()}
						src={author.imageSrc}
						width={56}
					/>
					<p className="text-xl">
						{author.firstName} {author.lastName}
					</p>
				</div>
			</div>
		</article>
	);
}
