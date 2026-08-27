import Link from 'next/link';

import { cn } from '@tsgi-web/shared';

import { ButtonLink } from '@/components/ui/button';
import { NewsArticlePreviewWide } from '@/components/ui/news-article-preview-wide';
import { SectionHeader } from '@/components/ui/section-header';
import type { Home, NewsArticlesQueryResult } from '@/types/sanity.types';

import styles from './news.module.css';

type NewsFields = Home['content']['newsSection'];
interface NewsProps extends NewsFields {
	articles: NewsArticlesQueryResult;
}

export function News({ articles, intro, subtitle, title }: Readonly<NewsProps>) {
	return (
		<section className={cn(styles.bg, 'relative z-0 bg-primary text-white')}>
			<div className="container mx-auto px-5 py-10 md:py-28">
				<SectionHeader
					descriptionClassName="text-white"
					subTitle={subtitle}
					title={title}
					isCentered
					isCenteredOnDesktop
				>
					{intro}
				</SectionHeader>

				<div className="mt-10 flex flex-col justify-center gap-12 md:mt-32">
					{articles.map((article) => (
						<NewsArticlePreviewWide key={article.slug} {...article} />
					))}
				</div>

				<footer className="mt-10 text-center md:mt-20">
					<ButtonLink render={<Link href="/news" />} variant="secondary">
						Alle Neuigkeiten ansehen
					</ButtonLink>
				</footer>
			</div>
		</section>
	);
}
