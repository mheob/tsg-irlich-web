import { cn } from '@tsgi-web/shared';
import type { Metadata } from 'next';

import { Hero } from '@/components/section/hero';
import { PortableText, type PortableTextValue } from '@/components/ui/portable-text';
import { Separator } from '@/components/ui/separator';
import { ZoomableImage } from '@/components/ui/zoomable-image';
import { client } from '@/lib/sanity/client';
import {
	newsArticleContentQuery,
	newsArticleHeroQuery,
} from '@/lib/sanity/queries/pages/news-article';
import { urlForImage } from '@/lib/sanity/utils';

import { Author } from './_sections/author';
import { Categories } from './_sections/categories';
import { SocialMedia } from './_sections/social-media';

export async function generateMetadata({
	params,
}: Readonly<PageProps<'/news/[category]/[slug]'>>): Promise<Metadata> {
	const { slug } = await params;

	const article = await client.fetch(newsArticleContentQuery, { slug });

	if (!article) return {};

	return {
		description: article.excerpt ?? '',
		openGraph: {
			description: article.excerpt ?? '',
			images: article.featuredImage
				? [
						{
							alt: article.featuredImage.alt ?? article.title,
							height: 630,
							url: urlForImage(article.featuredImage, 630, 1200) ?? '',
							width: 1200,
						},
					]
				: [],
			title: article.title ?? '',
		},
		title: article.title ?? '',
	};
}

export default async function NewsArticlePage({
	params,
}: Readonly<PageProps<'/news/[category]/[slug]'>>) {
	const { slug } = await params;

	const [hero, article] = await Promise.all([
		client.fetch(newsArticleHeroQuery),
		client.fetch(newsArticleContentQuery, { slug }),
	]);

	if (!article || !hero) {
		const { notFound } = await import('next/navigation');
		notFound();
		return null;
	}

	const imageSource = urlForImage(article.featuredImage, 600, 1920);

	return (
		<>
			<Hero
				image={{ alt: article.featuredImage?.alt ?? '', src: imageSource ?? '' }}
				subTitle={hero.subtitle}
				title={hero.title}
			/>

			<div className="container my-10 justify-center divide-y md:my-32 md:flex md:divide-x md:divide-y-0">
				<article className="prose lg:prose-xl pb-10 md:pr-10">
					<h1 className="leading-tight! hyphens-auto text-4xl font-bold md:text-6xl">
						{article.title}
					</h1>

					{article.body?.map(block => {
						switch (block._type) {
							case 'blockContent': {
								return <PortableText key={block._key} value={block.text as PortableTextValue} />;
							}
							case 'blockquote': {
								return (
									<blockquote className="border-l-primary md:text-2xl" key={block._key}>
										"{block.quote}"
										<cite className="text-muted-foreground block text-right not-italic">
											{block.author}
										</cite>
									</blockquote>
								);
							}
							case 'grid': {
								return (
									<div
										className={cn(
											'grid gap-4',
											{ 'grid-cols-1': block.columns.small === '1' },
											{ 'grid-cols-2': block.columns.small === '2' },
											{ 'grid-cols-3': block.columns.small === '3' },
											{ 'grid-cols-4': block.columns.small === '4' },
											{ 'sm:grid-cols-1': block.columns.medium === '1' },
											{ 'sm:grid-cols-2': block.columns.medium === '2' },
											{ 'sm:grid-cols-3': block.columns.medium === '3' },
											{ 'sm:grid-cols-4': block.columns.medium === '4' },
											{ 'md:grid-cols-1': block.columns.large === '1' },
											{ 'md:grid-cols-2': block.columns.large === '2' },
											{ 'md:grid-cols-3': block.columns.large === '3' },
											{ 'md:grid-cols-4': block.columns.large === '4' },
										)}
										key={block._key}
									>
										{block.items?.map(item => {
											if (item._type === 'mainImage') {
												return (
													<figure key={item._key}>
														<ZoomableImage
															alt={item.alt}
															height={450}
															src={urlForImage(item, 450, 800) ?? ''}
															srcFull={urlForImage(item, 1440, 2560) ?? ''}
															width={800}
														/>
														{item.description && (
															<figcaption className="text-center italic">
																{item.description}
															</figcaption>
														)}
													</figure>
												);
											}
											return null;
										})}
									</div>
								);
							}
							case 'mainImage': {
								return (
									<figure key={block._key}>
										<ZoomableImage
											alt={block.alt}
											height={450}
											src={urlForImage(block, 450, 800) ?? ''}
											srcFull={urlForImage(block, 1440, 2560) ?? ''}
											width={800}
										/>
										{block.description && (
											<figcaption className="text-center italic">{block.description}</figcaption>
										)}
									</figure>
								);
							}
							case 'spacer': {
								return <Separator className="my-10" key={block._key} />;
							}
							default: {
								return null;
							}
						}
					})}
				</article>

				<aside className="pt-10 md:pl-10 md:pt-0">
					<Author article={article} />
					<Categories article={article} />
					<SocialMedia />
				</aside>
			</div>
		</>
	);
}
