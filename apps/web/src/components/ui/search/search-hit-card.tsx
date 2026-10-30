import Link from 'next/link';

import type { SearchHit } from '@/lib/search/types';

import { Highlighted } from './highlighted';
import { SearchThumbnail } from './search-thumbnail';

/** The widths the card takes in the grid of the search page: four, two or one to a row. */
const THUMBNAIL_SIZES = '(min-width: 64rem) 20rem, (min-width: 40rem) 50vw, 100vw';

/**
 * The card of a page hit, in the „Seiten“ grid: the image on top, the title as the link, the meta
 * line and, when the hit has one, the snippet cut to two lines. The link covers the whole card.
 *
 * @param props - The card's props.
 * @param props.hit - The hit.
 * @param props.words - The search words, for the highlighting.
 * @returns The card.
 */
function SearchHitCard({ hit, words }: Readonly<SearchHitCardProps>) {
	return (
		<article className="group relative flex flex-col overflow-hidden rounded-xl bg-card shadow-lg transition-shadow hover:shadow-xl has-focus-visible:ring-2 has-focus-visible:ring-ring motion-reduce:transition-none">
			<SearchThumbnail
				className="aspect-video w-full"
				sizes={THUMBNAIL_SIZES}
				thumbnail={hit.thumbnail}
			/>

			<div className="flex flex-1 flex-col gap-1 p-4">
				<h3 className="text-lg font-bold hyphens-auto text-primary">
					<Link
						className="outline-none group-hover:text-primary-light after:absolute after:inset-0"
						href={hit.href}
					>
						<Highlighted text={hit.title} words={words} />
					</Link>
				</h3>

				<p className="text-sm text-muted-foreground">{hit.meta}</p>

				{hit.snippet && (
					<p className="mt-1 line-clamp-2 text-sm">
						<Highlighted text={hit.snippet} words={words} />
					</p>
				)}
			</div>
		</article>
	);
}

interface SearchHitCardProps {
	hit: SearchHit;
	words: string[];
}

export { SearchHitCard };
