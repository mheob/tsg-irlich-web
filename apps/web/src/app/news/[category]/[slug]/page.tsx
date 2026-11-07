// oxlint-disable react/no-unescaped-entities
// oxlint-disable import/max-dependencies
//
import type { Metadata } from 'next';
import { stegaClean } from 'next-sanity';
import Image from 'next/image';
import { notFound, permanentRedirect } from 'next/navigation';

import { cn } from '@tsgi-web/shared';

import { Hero } from '@/components/section/hero';
import { Gallery } from '@/components/ui/gallery';
import { JsonLd } from '@/components/ui/json-ld';
import { LightboxGallery, LightboxTrigger } from '@/components/ui/lightbox';
import { PortableText } from '@/components/ui/portable-text';
import { Separator } from '@/components/ui/separator';
import { ZoomableImage } from '@/components/ui/zoomable-image';
import { sanityFetch } from '@/lib/sanity/live';
import {
	newsArticleContentQuery,
	newsArticleHeroQuery,
	newsArticleRedirectQuery,
} from '@/lib/sanity/queries/pages/news-article';
import { socialMediaQuery } from '@/lib/sanity/queries/shared/social-media';
import { sponsorsQuery } from '@/lib/sanity/queries/shared/sponsors';
import { urlForImage } from '@/lib/sanity/utils';
import { getGalleryImages } from '@/utils/image';
import { getInternalHref } from '@/utils/links';
import { getPageMetadata } from '@/utils/metadata';
import { resolveNewsArticleRedirect } from '@/utils/news-redirect';
import { getNewsArticleSchema } from '@/utils/structured-data';
import { getLastModified } from '@/utils/time';
import { getBaseUrl } from '@/utils/url';

import { getArticlePath } from '../../_shared/utils';
import { Author } from './_sections/author';
import { Categories } from './_sections/categories';
import { Downloads } from './_sections/downloads';
import { SocialMedia } from './_sections/social-media';
import { Sponsors } from './_sections/sponsors';

const IMAGE_SIZE = { height: 600, width: 1920 };
const CONTENT_IMAGE_SIZE = { height: 450, width: 800 };

/**
 * Prerenders no article at build time. The empty list is what makes the route static: every article
 * is rendered on its first request and then served from the cache until the revalidation webhook
 * expires it. Without `generateStaticParams` the route would render on every request.
 *
 * @returns No params.
 */
export function generateStaticParams(): { category: string; slug: string }[] {
	return [];
}

export async function generateMetadata({
	params,
}: Readonly<PageProps<'/news/[category]/[slug]'>>): Promise<Metadata> {
	const { category, slug } = await params;

	const { data: article } = await sanityFetch({
		params: { slug },
		query: newsArticleContentQuery,
		stega: false,
	});

	if (!article) {
		return {};
	}

	const authorName = [article.author?.firstName, article.author?.lastName]
		.filter(Boolean)
		.join(' ');

	return getPageMetadata({
		description: article.excerpt,
		image: article.featuredImage,
		meta: article.meta,
		openGraph: {
			authors: authorName ? [authorName] : undefined,
			modifiedTime: getLastModified(article.publishedAt, article._updatedAt),
			publishedTime: article.publishedAt,
			type: 'article',
		},
		path: getArticlePath(article, category, slug),
		title: article.title,
	});
}

export default async function NewsArticlePage({
	params,
}: Readonly<PageProps<'/news/[category]/[slug]'>>) {
	const { category, slug } = await params;

	const [{ data: hero }, { data: article }, { data: socialMedia }, { data: sponsors }] =
		await Promise.all([
			sanityFetch({ query: newsArticleHeroQuery }),
			sanityFetch({ params: { slug }, query: newsArticleContentQuery }),
			sanityFetch({ query: socialMediaQuery }),
			sanityFetch({ query: sponsorsQuery }),
		]);

	if (!article) {
		// An article whose slug changed stays reachable under its old address, which was shared on
		// Facebook, Instagram and WhatsApp. Only a slug no article uses today gets here, so the article
		// that has a slug now never redirects, and the target is always a current path, so it cannot
		// loop. A renamed category needs nothing of its own here: the article is still found by its
		// slug, and the category check below sends it to its first category.
		const { data: match } = await sanityFetch({
			params: { slug },
			query: newsArticleRedirectQuery,
			stega: false,
		});
		const target = resolveNewsArticleRedirect(match);

		if (target) {
			permanentRedirect(target);
		}

		notFound();
	}

	if (!hero) {
		notFound();
	}

	// The query finds an article by its slug alone, so it would render under any category segment,
	// and the cache would keep a copy for every one somebody typed. It lives under its first
	// category, where every link points; another segment is sent there, and an article without a
	// category has no page. Draft mode marks the slugs with stega, which the path must not carry.
	const articlePath = getInternalHref({
		_type: 'news.article',
		category: stegaClean(article.categories?.[0]?.slug),
		slug: stegaClean(article.slug),
	});
	if (!articlePath) {
		notFound();
	}
	if (articlePath !== `/news/${category}/${slug}`) {
		permanentRedirect(articlePath);
	}

	const imageSource = urlForImage(article.featuredImage, IMAGE_SIZE.height, IMAGE_SIZE.width);
	// Only the fields the structured data reads, cleaned of the stega encoding draft mode adds, which
	// leaves the rendered article and its click-to-edit overlays alone.
	const articleSchema = getNewsArticleSchema(
		getBaseUrl(),
		articlePath,
		stegaClean({
			_updatedAt: article._updatedAt,
			author: article.author,
			excerpt: article.excerpt,
			featuredImage: article.featuredImage,
			meta: article.meta,
			publishedAt: article.publishedAt,
			title: article.title,
		}),
	);

	return (
		<>
			<JsonLd data={articleSchema} />

			<Hero
				// The hero's title is the same on every article, so the breadcrumb ends in the headline. The
				// category is the one of the URL, matched by its slug, which stega must not change.
				breadcrumb={{
					page: article.title,
					parents: {
						[`/news/${category}`]: article.categories?.find(
							(entry) => stegaClean(entry?.slug) === category,
						)?.title,
					},
				}}
				image={
					article.featuredImage?.alt && imageSource
						? { alt: article.featuredImage.alt, src: imageSource }
						: undefined
				}
				// The headline of the article below is the page's h1, not the generic title of the hero.
				isTitleHeading={false}
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
							case 'gallery': {
								return (
									<Gallery
										className="my-10"
										hasRoundedCorners={false}
										images={getGalleryImages(
											block.images,
											CONTENT_IMAGE_SIZE.height,
											CONTENT_IMAGE_SIZE.width,
										)}
										key={block._key}
										title={block.title}
									/>
								);
							}
							case 'grid': {
								// The column counts are compared against string literals, so the stega
								// encoding has to be removed before they can be used
								const columns = stegaClean(block.columns);
								const gridImages = getGalleryImages(
									block.items?.filter((item) => item._type === 'mainImage'),
									CONTENT_IMAGE_SIZE.height,
									CONTENT_IMAGE_SIZE.width,
								);

								return (
									<LightboxGallery images={gridImages} key={block._key}>
										<div
											className={cn(
												'grid gap-4',
												{ 'grid-cols-1': columns.small === '1' },
												{ 'grid-cols-2': columns.small === '2' },
												{ 'grid-cols-3': columns.small === '3' },
												{ 'grid-cols-4': columns.small === '4' },
												{ 'sm:grid-cols-1': columns.medium === '1' },
												{ 'sm:grid-cols-2': columns.medium === '2' },
												{ 'sm:grid-cols-3': columns.medium === '3' },
												{ 'sm:grid-cols-4': columns.medium === '4' },
												{ 'md:grid-cols-1': columns.large === '1' },
												{ 'md:grid-cols-2': columns.large === '2' },
												{ 'md:grid-cols-3': columns.large === '3' },
												{ 'md:grid-cols-4': columns.large === '4' },
											)}
										>
											{gridImages.map((image, index) => (
												<figure key={image.key}>
													<LightboxTrigger index={index}>
														<Image
															alt={image.alt}
															height={CONTENT_IMAGE_SIZE.height}
															sizes="(min-width: 768px) 50vw, 100vw"
															src={image.src}
															width={CONTENT_IMAGE_SIZE.width}
														/>
													</LightboxTrigger>
													{image.caption && (
														<figcaption className="text-center italic">{image.caption}</figcaption>
													)}
												</figure>
											))}
										</div>
									</LightboxGallery>
								);
							}
							case 'mainImage': {
								const [image] = getGalleryImages(
									[block],
									CONTENT_IMAGE_SIZE.height,
									CONTENT_IMAGE_SIZE.width,
								);

								if (!image) {
									return null;
								}

								return (
									<figure key={block._key}>
										<ZoomableImage
											height={CONTENT_IMAGE_SIZE.height}
											image={image}
											sizes="(min-width: 1024px) 50vw, 100vw"
											width={CONTENT_IMAGE_SIZE.width}
										/>
										{image.caption && (
											<figcaption className="text-center italic">{image.caption}</figcaption>
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

					<Downloads downloads={article.downloads} />
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
