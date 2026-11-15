import { Fragment } from 'react';

import { withValueAnchors } from '../_shared/anchors';
import type { ValuesSection } from '../_shared/types';
import { TableOfContents } from './table-of-contents';
import { ValueArticle } from './value-article';

/**
 * A sentence of the editors that follows a value, large on yellow, such as „Wir glauben an die
 * verbindende Kraft des Sports!“.
 *
 * @param props - The quote.
 * @param props.text - The sentence.
 * @returns The quote.
 */
function PullQuote({ text }: Readonly<{ text: string }>) {
	return (
		<figure className="my-4 rounded-2xl bg-secondary px-6 py-10 md:px-12 md:py-14">
			<blockquote className="font-serif text-4xl/tight text-secondary-foreground uppercase md:text-6xl">
				<p className="text-secondary-foreground">„{text}“</p>
			</blockquote>
		</figure>
	);
}

/**
 * The values of the club as a long read: the table of contents on the left, the numbered values on
 * the right, each followed by its quote where it has one.
 *
 * @param props - The section.
 * @param props.section - The heading of the table of contents and the values from the studio.
 * @returns The section, or nothing without values.
 */
function Values({ section }: Readonly<{ section: ValuesSection }>) {
	const { tocTitle, values } = section;

	if (values.length === 0) {
		return null;
	}

	const anchored = withValueAnchors(values);

	return (
		<section className="container grid gap-10 py-10 md:py-24 lg:grid-cols-[16rem_1fr] lg:gap-16">
			<TableOfContents
				entries={anchored.map(({ anchor, value }) => ({ anchor, title: value.title }))}
				title={tocTitle}
			/>

			<div>
				{anchored.map(({ anchor, value }, index) => (
					<Fragment key={value._key}>
						<ValueArticle anchor={anchor} index={index} value={value} />
						{value.quote && <PullQuote text={value.quote} />}
					</Fragment>
				))}
			</div>
		</section>
	);
}

export { Values };
