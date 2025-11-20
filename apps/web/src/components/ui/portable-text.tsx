/**
 * This component uses Portable Text to render a post body.
 *
 * You can learn more about Portable Text on:
 * https://www.sanity.io/docs/block-content
 * https://github.com/portabletext/react-portabletext
 * https://portabletext.org/
 *
 */

import {
	type PortableTextBlock,
	type PortableTextComponent,
	type PortableTextComponents,
	type PortableTextMarkComponent,
	PortableText as PortableTextPrimitive,
	type PortableTextProps as PortableTextPrimitiveProps,
} from 'next-sanity';
import NextLink from 'next/link';

function HeadingAnchorLink({ value }: Readonly<{ value: PortableTextBlock }>) {
	return (
		<a
			className="absolute start-0 top-0 bottom-0 -ml-6 flex items-center opacity-0 transition-opacity group-hover:opacity-100"
			href={`#${value?._key}`}
			title="Zum Abschnitt springen"
		>
			<svg
				className="h-4 w-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
				/>
			</svg>
		</a>
	);
}

const H2WithAnchor: PortableTextComponent<PortableTextBlock> = ({ children, value }) => (
	<h2 className="group relative" id={value?._key}>
		{children}
		<HeadingAnchorLink value={value} />
	</h2>
);

const H3WithAnchor: PortableTextComponent<PortableTextBlock> = ({ children, value }) => (
	<h3 className="group relative" id={value?._key}>
		{children}
		<HeadingAnchorLink value={value} />
	</h3>
);

const Link: PortableTextMarkComponent = ({ children, value }) => {
	const href = value?.href;
	if (!href || typeof href !== 'string') return children;

	// Regex finds starting with `/` or `https://` or `http://`, an optional subdomain and then `tsg-irlich.de`
	const internalLinkRegex = /^(?:\/|https?:\/\/(?:[a-z0-9-]+\.)?tsg-irlich\.de(?:\/|$))/i;

	if (internalLinkRegex.test(href)) {
		return <NextLink href={href}>{children}</NextLink>;
	}

	return (
		<a
			aria-label={`${children?.toString() || 'Link'} (öffnet in neuem Tab)`} // NOSONAR
			href={value.href}
			rel="noopener noreferrer"
			target="_blank"
		>
			{children}
		</a>
	);
};

export type PortableTextValue = PortableTextPrimitiveProps['value'];

interface PortableTextProps {
	value: PortableTextValue;
}

export function PortableText({ value }: Readonly<PortableTextProps>) {
	const components: PortableTextComponents = {
		block: {
			blockquote: ({ children }) => (
				<blockquote className="border-l-4 border-gray-300 pl-4">{children}</blockquote>
			),
			h2: H2WithAnchor,
			h3: H3WithAnchor,
		},
		list: {
			bullet: ({ children }) => <ul className="list-disc pl-4">{children}</ul>,
			number: ({ children }) => <ol className="list-decimal pl-4">{children}</ol>,
		},
		listItem: {
			bullet: ({ children }) => <li className="ml-2">{children}</li>,
			number: ({ children }) => <li className="ml-2">{children}</li>,
		},
		marks: {
			link: Link,
		},
	};

	return <PortableTextPrimitive components={components} value={value} />;
}
