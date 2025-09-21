'use client';

import type { AnchorHTMLAttributes, CSSProperties } from 'react';
import { useCallback, useState } from 'react';

function reverse(stringToReverse: string): string {
	return [...stringToReverse].toReversed().join('').replace('(', ')').replace(')', '(');
}

function createContactLink({
	header,
	href,
}: Pick<ContactLinkProps, 'header' | 'href'>): string | undefined {
	const combinedHeader =
		header &&
		Object.keys(header)
			.map(key => `${key}=${encodeURIComponent(header[key] ?? '')}`)
			.join('&');

	if (href.startsWith('https://wa.me/') || href.startsWith('mailto:')) {
		return header ? `${href}?${combinedHeader}` : href;
	}

	if (href.startsWith('tel:')) {
		return href.replaceAll(/\s/g, '');
	}
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
	const [humanInteractedState, setHumanInteractedState] = useState(false);
	const hrefText = href.slice(Math.max(0, href.indexOf(':') + 1));

	const handleCopyability = useCallback(() => {
		setHumanInteractedState(true);
	}, []);

	const directionStyle: CSSProperties = {
		...style,
		direction: humanInteractedState ? 'ltr' : 'rtl',
		unicodeBidi: 'bidi-override',
	};

	const renderProps: AnchorHTMLAttributes<HTMLAnchorElement> = {
		...props,
		href: humanInteractedState === true ? createContactLink({ header, href }) : 'obfuscated',
		onContextMenu: handleCopyability,
		onFocus: handleCopyability,
		onMouseOver: handleCopyability,
		style: directionStyle,
	};

	return (
		<a {...renderProps}>{children || (humanInteractedState ? hrefText : reverse(hrefText))}</a>
	);
}
