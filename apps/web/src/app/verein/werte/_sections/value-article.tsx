import { PageIcon } from '@/components/ui/page-icon';
import { PortableText } from '@/components/ui/portable-text';
import { withUniqueKeys } from '@/utils/keys';

import { toNumber } from '../_shared/numbers';
import type { ClubValue } from '../_shared/types';

/**
 * The terms of a value as dark tiles in two columns, such as „Teamgeist“ and „Respekt“.
 *
 * @param props - The terms and the value they belong to.
 * @param props.items - The terms.
 * @param props.title - The title of the value, which names the list.
 * @returns The list.
 */
function Highlights({ items, title }: Readonly<{ items: readonly string[]; title: string }>) {
	return (
		<ul aria-label={`Schlagworte ${title}`} className="mt-8 grid grid-cols-2 gap-3">
			{withUniqueKeys(items, (item) => item).map(({ key, value: item }) => (
				<li
					className="rounded-xl bg-primary px-3 py-6 text-center font-serif text-xl text-secondary uppercase sm:text-3xl md:py-8 md:text-4xl"
					key={key}
				>
					{item}
				</li>
			))}
		</ul>
	);
}

/**
 * One value of the club: its number in outline and its icon on the left, title, core statement
 * and text on the right, and the terms as tiles below the text where the value has any.
 *
 * @param props - The value, its position and its anchor.
 * @param props.anchor - The id the table of contents links to.
 * @param props.index - The position of the value, from 0.
 * @param props.value - The value from the studio.
 * @returns The article.
 */
function ValueArticle({ anchor, index, value }: Readonly<ValueArticleProps>) {
	const { highlights, icon, teaser, text, title } = value;

	return (
		<article
			className="grid scroll-mt-28 gap-4 border-t border-border py-12 first:border-t-0 first:pt-0 md:grid-cols-[7rem_1fr] md:gap-8 md:py-16"
			id={anchor}
		>
			<div className="flex items-center gap-4 md:flex-col md:items-start">
				<span
					aria-hidden="true"
					className="font-serif text-7xl leading-none text-transparent [-webkit-text-stroke:2px_var(--color-primary-light)] md:text-8xl"
				>
					{toNumber(index)}
				</span>
				<span className="grid size-12 place-items-center rounded-xl bg-secondary text-primary">
					<PageIcon aria-hidden="true" className="size-7" icon={icon} strokeWidth={1.5} />
				</span>
			</div>

			<div className="max-w-3xl">
				<h2 className="font-serif text-4xl uppercase md:text-6xl">{title}</h2>
				{teaser && <p className="mt-3 text-lg font-semibold text-primary md:text-2xl">{teaser}</p>}
				{text.text?.length ? (
					<div className="mt-6 space-y-4 md:text-lg">
						<PortableText value={text.text} />
					</div>
				) : null}
				{highlights?.length ? <Highlights items={highlights} title={title} /> : null}
			</div>
		</article>
	);
}

interface ValueArticleProps {
	anchor: string;
	index: number;
	value: ClubValue;
}

export { ValueArticle };
