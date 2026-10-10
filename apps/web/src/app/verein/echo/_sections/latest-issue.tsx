import Image from 'next/image';
import Link from 'next/link';

import { ButtonLink } from '@/components/ui/button';
import type { EchoIssuesQueryResult } from '@/types/sanity.types';
import { getEchoIssuePath } from '@/utils/links';

import { getCoverUrl, getIssueYear, getPdfDownload } from '../_shared/utils';

const COVER_WIDTH = 800;

/**
 * The newest issue as a wide card: a large cover, its intro, and the ways to read it.
 *
 * @param props - The card's props.
 * @param props.issue - The newest issue.
 * @returns The card.
 */
function LatestIssue({ issue }: Readonly<LatestIssueProps>) {
	const href = getEchoIssuePath(issue.slug);
	const cover = getCoverUrl(issue.cover, COVER_WIDTH, issue.indexable);
	const download = getPdfDownload(issue.pdf, issue.indexable);

	return (
		<article className="mt-10 grid gap-6 rounded-xl bg-background md:mt-16 md:grid-cols-[2fr_3fr] md:gap-12">
			{cover && (
				<Link className="relative block aspect-[1/1.414] overflow-hidden rounded-xl" href={href}>
					{/* The LCP element of the page. The optimizer would serve a hidden issue's cover without the noindex header. */}
					<Image
						alt={`Titelseite von ${issue.title}`}
						className="object-cover"
						fill
						preload
						sizes="(min-width: 48rem) 40vw, 100vw"
						src={cover}
						unoptimized={!issue.indexable}
					/>
				</Link>
			)}

			<div className="flex flex-col justify-center gap-4">
				<p className="text-sm uppercase md:text-lg">
					Neueste Ausgabe · {getIssueYear(issue.releaseDate)}
				</p>
				<h2 className="text-3xl font-bold md:text-5xl">
					<Link href={href}>{issue.title}</Link>
				</h2>
				{issue.intro && <p className="line-clamp-4 md:text-xl">{issue.intro}</p>}
				<div className="flex flex-wrap gap-4">
					<ButtonLink render={<Link href={href} />}>Durchblättern</ButtonLink>
					{download && (
						<ButtonLink download href={download.href} variant="secondary">
							PDF herunterladen ({download.size})
						</ButtonLink>
					)}
				</div>
			</div>
		</article>
	);
}

interface LatestIssueProps {
	issue: EchoIssuesQueryResult[number];
}

export { LatestIssue };
