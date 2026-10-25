'use client';

import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { useState } from 'react';

// Hidden from sight and from assistive technology, but part of the markup and the text content: a
// harvester reading either finds the address in two pieces with this in between, none of which
// forms an address. Visitors see, copy and hear the address in one piece.
const SPAM_GUARD = ' [Spamschutz] ';

/**
 * Splits the address in front of its `@`, or in the middle when it has none (a phone number), and
 * puts the hidden spam guard in between.
 *
 * @param address - The email address or phone number the link shows.
 * @returns The two halves with the guard between them.
 */
function guardAddress(address: string) {
	const atIndex = address.indexOf('@');
	const splitIndex = atIndex > 0 ? atIndex : Math.floor(address.length / 2);

	return (
		<>
			{address.slice(0, splitIndex)}
			<span hidden>{SPAM_GUARD}</span>
			{address.slice(splitIndex)}
		</>
	);
}

function createContactLink({ header, href }: Pick<ContactLinkProps, 'header' | 'href'>): string {
	const combinedHeader = header
		? Object.keys(header)
				.map((key) => `${key}=${encodeURIComponent(header[key] ?? '')}`)
				.join('&')
		: '';

	if (href.startsWith('https://wa.me/') || href.startsWith('mailto:')) {
		return header ? `${href}?${combinedHeader}` : href;
	}

	if (href.startsWith('tel:')) {
		return href.replaceAll(/\s/gu, '');
	}

	return href;
}

interface ContactLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	header?: {
		[index: string]: string | undefined;
		bcc?: string;
		body?: string;
		cc?: string;
		subject?: string;
		text?: string;
	};
	href: string;
}

export function ContactLink({ children, header, href, ...props }: Readonly<ContactLinkProps>) {
	const [hasInteracted, setHasInteracted] = useState(false);
	const hrefText = href.slice(Math.max(0, href.indexOf(':') + 1));

	const handleInteraction = () => {
		setHasInteracted(true);
	};

	const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
		if (!hasInteracted) {
			event.preventDefault();
			setHasInteracted(true);
		}
	};

	// The accessible name comes from the visible text or from the caller's `aria-label`, never from a
	// generic label of its own (WCAG 2.5.3). The real target only exists after an interaction.
	const renderProps: AnchorHTMLAttributes<HTMLAnchorElement> = {
		...props,
		href: hasInteracted ? createContactLink({ header, href }) : '#',
		onClick: handleClick,
		onContextMenu: handleInteraction,
		onFocus: handleInteraction,
		onKeyDown: (event) => {
			if (event.key === 'Enter' || event.key === ' ') {
				handleInteraction();
			}
		},
		onMouseOver: handleInteraction,
		onTouchStart: handleInteraction,
		role: hasInteracted ? 'link' : 'button',
	};

	return <a {...renderProps}>{children ?? guardAddress(hrefText)}</a>;
}
