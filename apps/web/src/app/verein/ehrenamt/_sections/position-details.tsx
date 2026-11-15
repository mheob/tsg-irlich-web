import { CircleCheck } from 'lucide-react';
import { useId } from 'react';

import { ButtonLink } from '@/components/ui/button';
import { withUniqueKeys } from '@/utils/keys';

import type { Position } from '../_shared/types';

/**
 * One list of an open position under its heading, such as „Deine Aufgaben“. The heading names the
 * list, so a screen reader does not read the same words twice.
 *
 * @param props - The heading and the items.
 * @param props.heading - The heading from the studio.
 * @param props.headingId - The id of the heading, unique on the page.
 * @param props.items - The items; the caller leaves an empty list out.
 * @returns The list.
 */
function DetailList({ heading, headingId, items }: Readonly<DetailListProps>) {
	return (
		<div>
			<h4 className="font-sans-serif font-bold uppercase" id={headingId}>
				{heading}
			</h4>
			<ul aria-labelledby={headingId} className="mt-2 space-y-2">
				{withUniqueKeys(items, (item) => item).map(({ key, value: item }) => (
					<li className="flex items-start gap-2 text-sm md:text-base" key={key}>
						<CircleCheck aria-hidden="true" className="mt-0.5 size-5 min-w-5 text-primary-light" />
						{item}
					</li>
				))}
			</ul>
		</div>
	);
}

/**
 * What an open position shows once it is opened: the teaser, up to three lists and the button that
 * starts the mail.
 *
 * @param props - The position and the texts every position shares.
 * @param props.cta - The text of the button.
 * @param props.headings - The headings of the three lists.
 * @param props.href - The `mailto:` link of the button.
 * @param props.position - The position.
 * @returns The details.
 */
function PositionDetails({ cta, headings, href, position }: Readonly<PositionDetailsProps>) {
	const id = useId();
	const lists = [
		{ heading: headings.tasks, items: position.tasks, name: 'tasks' },
		{ heading: headings.profile, items: position.profile, name: 'profile' },
		{ heading: headings.offer, items: position.offer, name: 'offer' },
	].filter((list): list is DetailListEntry => Boolean(list.items?.length));

	return (
		<>
			<p className="md:text-lg">{position.teaser}</p>
			{lists.length > 0 && (
				<div className="mt-6 grid gap-6 md:grid-cols-3">
					{lists.map((list) => (
						<DetailList
							heading={list.heading}
							headingId={`${id}-${list.name}`}
							items={list.items}
							key={list.name}
						/>
					))}
				</div>
			)}
			<div className="mt-8">
				<ButtonLink href={href} size="sm">
					{cta}
				</ButtonLink>
			</div>
		</>
	);
}

interface DetailListProps {
	heading: string;
	headingId: string;
	items: string[];
}

interface DetailListEntry {
	heading: string;
	items: string[];
	name: string;
}

interface PositionDetailsProps {
	cta: string;
	headings: { offer: string; profile: string; tasks: string };
	href: string;
	position: Position;
}

export { PositionDetails };
