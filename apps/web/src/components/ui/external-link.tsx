import type { ComponentProps } from 'react';

type ExternalLinkProps = ComponentProps<'a'>;

export function ExternalLink({
	children,
	className = '',
	rel,
	...props
}: Readonly<ExternalLinkProps>) {
	return (
		<a
			className={className}
			rel={rel ? `${rel} noopener noreferrer` : 'noopener noreferrer'}
			target="_blank"
			{...props}
		>
			{children}
		</a>
	);
}
