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
			className="absolute bottom-0 start-0 top-0 -ml-6 flex items-center opacity-0 transition-opacity group-hover:opacity-100"
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
	if (!value) return children;

	const href = value.href as string;

	// Regex finds starting with `/` or `https://` or `http://`, an optional subdomain and then `tsg-irlich.de`
	const internalLinkRegex = /^(?:\/|https?:\/\/(?:\w+\.)?tsg-irlich\.de)/;

	if (internalLinkRegex.test(href)) {
		return <NextLink href={value.href}>{children}</NextLink>;
	}

	return (
		<a href={value.href} rel="noopener" target="_blank">
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
			h2: H2WithAnchor,
			h3: H3WithAnchor,
		},
		marks: {
			link: Link,
		},
	};

	return <PortableTextPrimitive components={components} value={value} />;
}
