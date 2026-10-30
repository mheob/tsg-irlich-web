import Link from 'next/link';

import { getSearchPath } from '@/lib/search/path';

import { CHIP_CLASS_NAME } from '../_shared/chip-class-name';

/**
 * „Häufig gesucht“: terms that start a search with one click. The page shows them next to the
 * empty state and instead of results while there is no search term.
 *
 * @param props - The list's props.
 * @param props.terms - The terms, in the order they are shown.
 * @param props.title - The heading.
 * @returns The list, or nothing without a term, so no heading stands over an empty list.
 */
function PopularSearches({ terms, title }: Readonly<PopularSearchesProps>) {
	if (terms.length === 0) {
		return null;
	}

	return (
		<section className="mt-10 md:mt-16">
			<h2 className="mb-4 text-xl md:mb-6 md:text-3xl">{title}</h2>
			<ul className="flex flex-wrap gap-2">
				{terms.map((term) => (
					<li key={term}>
						<Link className={CHIP_CLASS_NAME} href={getSearchPath(term)}>
							{term}
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}

interface PopularSearchesProps {
	terms: string[];
	title: string;
}

export { PopularSearches };
