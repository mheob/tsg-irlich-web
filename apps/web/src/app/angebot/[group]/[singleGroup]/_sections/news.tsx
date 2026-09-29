import Link from 'next/link';

import { ButtonLink } from '@/components/ui/button';
import { NewsArticleGrid } from '@/components/ui/news-article-grid';
import { SectionHeader } from '@/components/ui/section-header';
import type { OfferGroupsGroupPageNewsQueryResult } from '@/types/sanity.types';
import { getInternalHref } from '@/utils/links';

type NewsProps = NonNullable<OfferGroupsGroupPageNewsQueryResult>;

export function News({ _type, articles, slug, title }: Readonly<NewsProps>) {
	const categoryHref = getInternalHref({ _type, slug });

	return (
		<section className="relative z-0">
			<div className="container mx-auto px-5 py-10 md:py-32">
				<SectionHeader
					title={
						<>
							Aktuelles aus dem Bereich <span className="text-primary">{title}</span>
						</>
					}
					className="pb-8 md:pb-14"
					subTitle="News"
					isCentered
					isCenteredOnDesktop
				/>

				<NewsArticleGrid articles={articles} />

				{categoryHref && (
					<footer className="mt-10 text-center md:mt-20">
						<ButtonLink render={<Link href={categoryHref} />}>
							Alle Neuigkeiten aus {title}
						</ButtonLink>
					</footer>
				)}
			</div>
		</section>
	);
}
