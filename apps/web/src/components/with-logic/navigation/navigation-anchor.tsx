import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps } from 'react';

import { ExternalLink } from '@/components/ui/external-link';

import type { NavigationLink } from './navigation-entries';

/** Tells a screen reader user, right after the label, that the link leaves the current tab. */
const NEW_TAB_HINT = '(öffnet in neuem Tab)';

// The anchor both menus render for a navigation link: `next/link` inside the website, `ExternalLink`
// with a visible icon and a screen reader hint outside of it. Every other prop goes to the anchor,
// so Base UI can use it as a `render` element.
function NavigationAnchor({ link, ...props }: Readonly<NavigationAnchorProps>) {
	if (link.isExternal) {
		return (
			<ExternalLink href={link.href} {...props}>
				{link.title}
				{/* Keeps the accessible name "Stadt Neuwied (öffnet …)" apart; a flex container drops it visually. */}{' '}
				<ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
				<span className="sr-only">{NEW_TAB_HINT}</span>
			</ExternalLink>
		);
	}

	return (
		<Link href={link.href} {...props}>
			{link.title}
		</Link>
	);
}

interface NavigationAnchorProps extends Omit<ComponentProps<'a'>, 'children' | 'href'> {
	link: NavigationLink;
}

export { NavigationAnchor };
