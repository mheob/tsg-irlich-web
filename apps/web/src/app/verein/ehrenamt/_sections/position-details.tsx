import { CircleCheck } from 'lucide-react';

import { ButtonLink } from '@/components/ui/button';

import type { Position } from '../_shared/types';

/**
 * One list of an open position under its heading, such as „Deine Aufgaben“.
 *
 * @param props - The heading and the items.
 * @param props.heading - The heading from the studio.
 * @param props.items - The items; the caller leaves an empty list out.
 * @returns The list.
 */
function DetailList({ heading, items }: Readonly<{ heading: string; items: string[] }>) {
	return (
		<div>
			<h4 className="font-sans-serif font-bold uppercase">{heading}</h4>
			<ul aria-label={heading} className="mt-2 space-y-2">
				{items.map((item) => (
					<li className="flex items-start gap-2 text-sm md:text-base" key={item}>
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
	const lists = [
		{ heading: headings.tasks, items: position.tasks },
		{ heading: headings.profile, items: position.profile },
		{ heading: headings.offer, items: position.offer },
	].filter((list): list is { heading: string; items: string[] } => Boolean(list.items?.length));

	return (
		<>
			<p className="md:text-lg">{position.teaser}</p>
			{lists.length > 0 && (
				<div className="mt-6 grid gap-6 md:grid-cols-3">
					{lists.map((list) => (
						<DetailList heading={list.heading} items={list.items} key={list.heading} />
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

interface PositionDetailsProps {
	cta: string;
	headings: { offer: string; profile: string; tasks: string };
	href: string;
	position: Position;
}

export { PositionDetails };
