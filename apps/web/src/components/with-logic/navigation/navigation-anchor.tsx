import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useId } from 'react';
import type { ComponentProps } from 'react';

import { ExternalLink } from '@/components/ui/external-link';

import type { NavigationLink } from './navigation-entries';

/** Tells a screen reader user, right after the label, that the link leaves the current tab. */
const NEW_TAB_HINT = '(öffnet in neuem Tab)';

// The title of a navigation link, with the icon and the screen reader hint of an external one.
function NavigationLabel({ link }: Readonly<NavigationLabelProps>) {
	if (!link.isExternal) {
		return link.title;
	}

	return (
		<>
			{link.title}
			{/* Keeps the accessible name "Stadt Neuwied (öffnet …)" apart; a flex container drops it visually. */}{' '}
			<ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
			<span className="sr-only">{NEW_TAB_HINT}</span>
		</>
	);
}

// The anchor both menus render for a navigation link: `next/link` inside the website, `ExternalLink`
// with a visible icon and a screen reader hint outside of it. Every other prop goes to the anchor,
// so Base UI can use it as a `render` element.
//
// `withDescription` adds the sub-text of the desktop dropdown under the title. The link is then named
// by its title alone and described by the sub-text, so a screen reader announces both without the
// sub-text becoming part of the name.
function NavigationAnchor({
	link,
	withDescription = false,
	...props
}: Readonly<NavigationAnchorProps>) {
	const id = useId();
	const description = withDescription ? link.description : null;
	const titleId = `${id}-title`;
	const descriptionId = `${id}-description`;

	const content = description ? (
		<span className="flex flex-col gap-0.5">
			<span className="flex items-center gap-1 font-medium" id={titleId}>
				<NavigationLabel link={link} />
			</span>
			<span className="line-clamp-2 text-sm text-muted-foreground" id={descriptionId}>
				{description}
			</span>
		</span>
	) : (
		<NavigationLabel link={link} />
	);
	const describedBy = description
		? { 'aria-describedby': descriptionId, 'aria-labelledby': titleId }
		: {};

	if (link.isExternal) {
		return (
			<ExternalLink href={link.href} {...describedBy} {...props}>
				{content}
			</ExternalLink>
		);
	}

	return (
		<Link href={link.href} {...describedBy} {...props}>
			{content}
		</Link>
	);
}

interface NavigationLabelProps {
	link: NavigationLink;
}

interface NavigationAnchorProps extends Omit<ComponentProps<'a'>, 'children' | 'href'> {
	link: NavigationLink;
	withDescription?: boolean;
}

export { NavigationAnchor };
