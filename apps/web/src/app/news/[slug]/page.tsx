import Image from 'next/image';
import type { PortableTextBlock } from 'next-sanity';

import Hero from '@/components/section/hero';
import PortableText from '@/components/ui/portable-text';
import { Separator } from '@/components/ui/separator';
import { client } from '@/lib/sanity/client';
import {
	newsArticleContentQuery,
	newsArticleHeroQuery,
} from '@/lib/sanity/queries/pages/news-article';
import { urlForImage } from '@/lib/sanity/utils';
import type { PageProps } from '@/types/common';
import { cn } from '@/utils/cn';

import Author from './_sections/author';
import Categories from './_sections/categories';
import SocialMedia from './_sections/social-media';

export default async function NewsArticle({ params }: PageProps) {
	const { slug } = await params;

	const [hero, article] = await Promise.all([
		client.fetch(newsArticleHeroQuery),
		client.fetch(newsArticleContentQuery, { slug }),
	]);

	if (!article || !hero) return null;

	return (
		<>
			<Hero image={article.featuredImage} subTitle={hero.subtitle} title={hero.title} />

			<div className="container my-32 flex divide-x">
				<article className="prose lg:prose-xl pr-10">
					<h1 className="text-6xl font-bold leading-tight">{article.title}</h1>

					{article.body?.map(block => {
						switch (block._type) {
							case 'blockContent': {
								return <PortableText key={block._key} value={block.text as PortableTextBlock[]} />;
							}
							case 'blockquote': {
								return (
									<blockquote className="border-l-primary text-2xl" key={block._key}>
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
														<Image
															alt={item.alt}
															height={450}
															src={urlForImage(item, 450, 800) ?? ''}
															width={800}
														/>
														<figcaption className="text-center italic">{item.alt}</figcaption>
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
										<Image
											alt={block.alt}
											height={450}
											src={urlForImage(block, 450, 800) ?? ''}
											width={800}
										/>
										<figcaption className="text-center italic">{block.alt}</figcaption>
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

				<aside className="pl-10">
					<Author article={article} />
					<Categories article={article} />
					<SocialMedia />
				</aside>
			</div>
		</>
	);
}