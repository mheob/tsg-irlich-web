'use client';

import type { AnchorHTMLAttributes, CSSProperties } from 'react';
import { useMemo, useState } from 'react';

function reverse(stringToReverse: string): string {
	return [...stringToReverse]
		.toReversed()
		.map(char => {
			if (char === '(') return ')';
			if (char === ')') return '(';
			return char;
		})
		.join('');
}

function createContactLink({ header, href }: Pick<ContactLinkProps, 'header' | 'href'>): string {
	const combinedHeader =
		(header &&
			Object.keys(header)
				.map(key => `${key}=${encodeURIComponent(header[key] ?? '')}`)
				.join('&')) ||
		'';

	if (href.startsWith('https://wa.me/') || href.startsWith('mailto:')) {
		return header ? `${href}?${combinedHeader}` : href;
	}

	if (href.startsWith('tel:')) {
		return href.replaceAll(/\s/g, '');
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

export function ContactLink({
	children,
	header,
	href,
	style,
	...props
}: Readonly<ContactLinkProps>) {
	const [hasInteracted, setHasInteracted] = useState(false);
	const hrefText = href.slice(Math.max(0, href.indexOf(':') + 1));

	const handleInteraction = () => setHasInteracted(true);

	const directionStyle: CSSProperties = useMemo(
		() => ({
			...style,
			direction: hasInteracted ? 'ltr' : 'rtl',
			unicodeBidi: 'bidi-override',
		}),
		[hasInteracted, style],
	);

	const renderProps: AnchorHTMLAttributes<HTMLAnchorElement> = {
		...props,
		'aria-label': hasInteracted ? undefined : 'Kontaktlink - tippen zum Anzeigen',
		href: hasInteracted ? createContactLink({ header, href }) : '#',
		onContextMenu: handleInteraction,
		onFocus: handleInteraction,
		onKeyDown: event => {
			if (event.key === 'Enter' || event.key === ' ') {
				handleInteraction();
			}
		},
		onMouseOver: handleInteraction,
		role: hasInteracted ? 'link' : 'button',
		style: directionStyle,
	};

	return <a {...renderProps}>{children || (hasInteracted ? hrefText : reverse(hrefText))}</a>;
}
