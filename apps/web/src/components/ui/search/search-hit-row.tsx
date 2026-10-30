import Link from 'next/link';

import { cn } from '@tsgi-web/shared';

import type { SearchHit } from '@/lib/search/types';

import { Highlighted } from './highlighted';
import { SearchThumbnail } from './search-thumbnail';

/** The widths the image takes: 8 rem on a phone, 13 rem from `sm`, 4 rem in the panel. */
const THUMBNAIL_SIZES = { compact: '4rem', full: '(min-width: 40rem) 13rem, 8rem' } as const;

/**
 * The row of a hit: the image on the left, then the text. The link covers the whole row.
 *
 * - The full row, as in the news list of the search page, reads meta line, title, snippet.
 * - The compact row, as in the search panel, reads title and meta line and leaves the snippet out.
 *
 * @param props - The row's props.
 * @param props.compact - Whether to show the small form without the snippet.
 * @param props.hit - The hit.
 * @param props.words - The search words, for the highlighting.
 * @returns The row.
 */
function SearchHitRow({ compact = false, hit, words }: Readonly<SearchHitRowProps>) {
	const meta = (
		<p className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>{hit.meta}</p>
	);

	const link = (
		<Link
			className="outline-none group-hover:text-primary-light after:absolute after:inset-0"
			href={hit.href}
		>
			<Highlighted text={hit.title} words={words} />
		</Link>
	);

	return (
		<article
			className={cn(
				'group relative flex items-start rounded-lg has-focus-visible:ring-2 has-focus-visible:ring-ring motion-reduce:transition-none',
				compact
					? 'gap-3 p-1.5 transition-colors hover:bg-background-low-contrast'
					: 'gap-4 py-4 sm:gap-6',
			)}
		>
			<SearchThumbnail
				className={compact ? 'h-11 w-16 rounded-md' : 'aspect-video w-32 rounded-lg sm:w-52'}
				sizes={compact ? THUMBNAIL_SIZES.compact : THUMBNAIL_SIZES.full}
				thumbnail={hit.thumbnail}
			/>

			<div className="flex min-w-0 flex-1 flex-col gap-1">
				{compact ? (
					<>
						<div className="line-clamp-2 text-sm font-medium text-foreground">{link}</div>
						{meta}
					</>
				) : (
					<>
						{meta}
						<h3 className="text-lg font-bold hyphens-auto text-primary md:text-xl">{link}</h3>
						{hit.snippet && (
							<p className="text-sm md:text-base">
								<Highlighted text={hit.snippet} words={words} />
							</p>
						)}
					</>
				)}
			</div>
		</article>
	);
}

interface SearchHitRowProps {
	compact?: boolean;
	hit: SearchHit;
	words: string[];
}

export { SearchHitRow };
