// oxlint-disable react/no-unescaped-entities
//
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { cn } from '@tsgi-web/shared';

import { Hero } from '@/components/section/hero';
import { PortableText } from '@/components/ui/portable-text';
import { Separator } from '@/components/ui/separator';
import { ZoomableImage } from '@/components/ui/zoomable-image';
import { client } from '@/lib/sanity/client';
import {
	newsArticleContentQuery,
	newsArticleHeroQuery,
} from '@/lib/sanity/queries/pages/news-article';
import { socialMediaQuery } from '@/lib/sanity/queries/shared/social-media';
import { sponsorsQuery } from '@/lib/sanity/queries/shared/sponsors';
import { urlForImage } from '@/lib/sanity/utils';
import type {
	NewsArticleContentQueryResult,
	NewsArticleHeroQueryResult,
	SocialMediaQueryResult,
	SponsorsQueryResult,
} from '@/types/sanity.types';

import { getOpenGraphImageOptions } from '../../_shared/utils';
import { Author } from './_sections/author';
import { Categories } from './_sections/categories';
import { SocialMedia } from './_sections/social-media';
import { Sponsors } from './_sections/sponsors';

const IMAGE_SIZE = { height: 600, width: 1920 };
const ZOOMABLE_IMAGE_SIZE = {
	large: { height: 1440, width: 2560 },
	small: { height: 450, width: 800 },
};

export async function generateMetadata({
	params,
}: Readonly<PageProps<'/news/[category]/[slug]'>>): Promise<Metadata> {
	const { slug } = await params;

	const article = await client.fetch<NewsArticleContentQueryResult>(newsArticleContentQuery, {
		slug,
	});

	if (!article) {
		return {};
	}

	const description = article.meta?.metaDescription ?? article.excerpt ?? '';
	const image = article.meta?.openGraphImage ?? article.featuredImage;
	const images = image ? getOpenGraphImageOptions(image, article.title) : [];
	const title = article.meta?.metaTitle ?? article.title ?? '';

	return {
		description,
		openGraph: { description, images, title },
		title,
	};
}

export default async function NewsArticlePage({
	params,
}: Readonly<PageProps<'/news/[category]/[slug]'>>) {
	const { slug } = await params;

	const [hero, article, socialMedia, sponsors] = await Promise.all([
		client.fetch<NewsArticleHeroQueryResult>(newsArticleHeroQuery),
		client.fetch<NewsArticleContentQueryResult>(newsArticleContentQuery, { slug }),
		client.fetch<SocialMediaQueryResult>(socialMediaQuery),
		client.fetch<SponsorsQueryResult>(sponsorsQuery),
	]);

	if (!article || !hero) {
		notFound();
	}

	const imageSource = urlForImage(article.featuredImage, IMAGE_SIZE.height, IMAGE_SIZE.width);

	return (
		<>
			<Hero
				image={
					article.featuredImage?.alt && imageSource
						? // oxlint-disable-next-line react_perf/jsx-no-new-object-as-prop
							{ alt: article.featuredImage.alt, src: imageSource }
						: undefined
				}
				subTitle={hero.subtitle}
				title={hero.title}
			/>

			<div className="container my-10 justify-center divide-y lg:my-32 lg:flex lg:divide-x lg:divide-y-0">
				<article className="prose pb-10 lg:prose-xl lg:pr-10">
					<h1 className="text-4xl leading-tight! font-bold hyphens-auto md:text-6xl">
						{article.title}
					</h1>

					{article.body?.map((block) => {
						switch (block._type) {
							case 'blockContent': {
								return <PortableText key={block._key} value={block.text} />;
							}
							case 'blockquote': {
								return (
									<blockquote key={block._key}>
										"{block.quote}"
										<cite className="block text-right text-muted-foreground not-italic">
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
										{block.items?.map((item) => {
											if (item._type === 'mainImage') {
												return (
													<figure key={item._key}>
														<ZoomableImage
															alt={item.alt}
															height={450}
															src={
																urlForImage(
																	item,
																	ZOOMABLE_IMAGE_SIZE.small.height,
																	ZOOMABLE_IMAGE_SIZE.small.width,
																) ?? ''
															}
															srcFull={
																urlForImage(
																	item,
																	ZOOMABLE_IMAGE_SIZE.large.height,
																	ZOOMABLE_IMAGE_SIZE.large.width,
																) ?? ''
															}
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
											src={
												urlForImage(
													block,
													ZOOMABLE_IMAGE_SIZE.small.height,
													ZOOMABLE_IMAGE_SIZE.small.width,
												) ?? ''
											}
											srcFull={
												urlForImage(
													block,
													ZOOMABLE_IMAGE_SIZE.large.height,
													ZOOMABLE_IMAGE_SIZE.large.width,
												) ?? ''
											}
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

				<aside className="pt-10 lg:pt-0 lg:pl-10">
					<Author article={article} />
					<Categories article={article} />
					<SocialMedia socialMedia={socialMedia} />
					{sponsors && sponsors.length > 0 && <Sponsors sponsors={sponsors} />}
				</aside>
			</div>
		</>
	);
}
