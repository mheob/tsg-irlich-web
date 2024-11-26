import Link from 'next/link';

import { Button } from '@/components/ui/button';
import NewsArticlePreviewWide from '@/components/ui/news-article-preview-wide';
import SectionHeader from '@/components/ui/section-header';
import type { GetHomePageNewsResult, Home } from '@/types/sanity.types';

import styles from './news.module.css';

type NewsFields = Home['content']['newsSection'];
interface NewsProps extends NewsFields {
	articles: GetHomePageNewsResult;
}

export default function News({ articles, intro, subtitle, title }: Readonly<NewsProps>) {
	return (
		<section className={`${styles.bg} bg-primary relative z-0 text-white`}>
			<div className="container mx-auto px-5 pb-40 pt-28">
				<SectionHeader
					descriptionClassName="text-white"
					subTitle={subtitle}
					title={title}
					isCentered
				>
					{intro}
				</SectionHeader>

				<div className="mt-32 flex flex-col justify-center gap-12">
					{articles.map(article => (
						<NewsArticlePreviewWide key={article.slug} {...article} />
					))}
				</div>

				<footer className="mt-20 text-center">
					<Button variant="secondary" asChild>
						<Link href="#!">Alle Neuigkeiten ansehen</Link>
					</Button>
				</footer>
			</div>
		</section>
	);
}
