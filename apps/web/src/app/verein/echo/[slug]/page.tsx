import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { ButtonLink } from '@/components/ui/button';
import { FlipbookLazy } from '@/components/with-logic/flipbook/flipbook-lazy';
import { client } from '@/lib/sanity/client';
import { echoIssueQuery, echoIssueSlugsQuery } from '@/lib/sanity/queries/pages/echo';
import type { EchoIssueQueryResult, EchoIssueSlugsQueryResult } from '@/types/sanity.types';
import { getEchoIssuePath } from '@/utils/links';
import { getPageMetadata } from '@/utils/metadata';

import { ECHO_HERO_IMAGE } from '../_shared/hero';
import {
	getCoverPage,
	getFlipbookPages,
	getIssueYear,
	getPageSize,
	getPdfDownload,
	toSanityImage,
} from '../_shared/utils';

export async function generateStaticParams(): Promise<{ slug: string }[]> {
	const slugs = await client.fetch<EchoIssueSlugsQueryResult>(echoIssueSlugsQuery);
	return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
	params,
}: Readonly<PageProps<'/verein/echo/[slug]'>>): Promise<Metadata> {
	const { slug } = await params;
	const issue = await client.fetch<EchoIssueQueryResult>(echoIssueQuery, { slug });

	if (!issue) {
		return {};
	}

	return getPageMetadata({
		description: issue.intro,
		image: toSanityImage(issue.cover),
		meta: issue.meta,
		path: getEchoIssuePath(slug),
		title: issue.title,
	});
}

export default async function EchoIssuePage({
	params,
}: Readonly<PageProps<'/verein/echo/[slug]'>>) {
	const { slug } = await params;
	const issue = await client.fetch<EchoIssueQueryResult>(echoIssueQuery, { slug });

	if (!issue?.pages?.length) {
		notFound();
	}

	const download = getPdfDownload(issue.pdf);
	const pageSize = getPageSize(issue.pageSize);

	return (
		<>
			<Hero
				image={ECHO_HERO_IMAGE}
				subTitle={getIssueYear(issue.releaseDate)}
				title={issue.title}
			/>

			<section className="container mx-auto flex flex-col items-center gap-10 py-10 md:py-20">
				{issue.intro && <p className="max-w-3xl text-center text-lg md:text-xl">{issue.intro}</p>}

				<FlipbookLazy
					cover={getCoverPage(issue.cover, issue.title)}
					label={`${issue.title} zum Durchblättern`}
					pageHeight={pageSize.height}
					pageWidth={pageSize.width}
					pages={getFlipbookPages(issue.pages)}
				/>

				{download && (
					<ButtonLink download href={download.href} variant="secondary">
						PDF herunterladen ({download.size})
					</ButtonLink>
				)}
			</section>

			<Newsletter />
		</>
	);
}
