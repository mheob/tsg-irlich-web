// oxlint-disable react/function-component-definition
/**
 * This component uses Portable Text to render a post body.
 *
 * You can learn more about Portable Text on:
 * https://www.sanity.io/docs/block-content
 * https://github.com/portabletext/react-portabletext
 * https://portabletext.org/
 *
 */

import type {
	PortableTextBlock,
	PortableTextComponent,
	PortableTextComponents,
	PortableTextListComponent,
	PortableTextListItemComponent,
	PortableTextMarkComponent,
	PortableTextProps as PortableTextPrimitiveProps,
} from 'next-sanity';
import { PortableText as PortableTextPrimitive } from 'next-sanity';
import NextLink from 'next/link';

const Blockquote: PortableTextComponent<PortableTextBlock> = ({ children }) => (
	<blockquote className="border-l-4 border-gray-300 pl-4">{children}</blockquote>
);

function HeadingAnchorLink({ value }: Readonly<{ value: PortableTextBlock }>) {
	return (
		<a
			className="absolute inset-y-0 inset-s-0 -ml-6 flex items-center opacity-0 transition-opacity group-hover:opacity-100"
			href={`#${value?._key}`}
			title="Zum Abschnitt springen"
		>
			<svg
				className="size-4"
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

const BulletList: PortableTextListComponent = ({ children }) => (
	<ul className="list-disc pl-4">{children}</ul>
);

const NumberList: PortableTextListComponent = ({ children }) => (
	<ol className="list-decimal pl-4">{children}</ol>
);

const ListItem: PortableTextListItemComponent = ({ children }) => (
	<li className="ml-2">{children}</li>
);

const ExternalLink: PortableTextMarkComponent = ({ children, value }) => (
	<a
		// oxlint-disable-next-line typescript/no-base-to-string
		aria-label={`${children?.toString() ?? 'Link'} (öffnet in neuem Tab)`}
		// oxlint-disable-next-line typescript/no-unsafe-member-access typescript/no-unsafe-assignment
		href={value?.href}
		rel="noopener noreferrer"
		target="_blank"
	>
		{children}
	</a>
);

const InternalLink: PortableTextMarkComponent = async ({ children, value }) => {
	// oxlint-disable-next-line typescript/no-unsafe-assignment typescript/no-unsafe-member-access
	const slug = value?.link && typeof value.link.slug === 'string' ? value.link.slug : undefined;
	if (!slug) {
		return children;
	}
	return <NextLink href={`/${slug}`}>{children}</NextLink>;
};

const Link: PortableTextMarkComponent = async ({ children, value }) => {
	// oxlint-disable-next-line typescript/no-unsafe-assignment typescript/no-unsafe-member-access
	const href = value?.href ?? value?.url;
	if (!href || typeof href !== 'string') {
		return children;
	}

	// Regex finds starting with `/` or `https://` or `http://`, an optional subdomain and then `tsg-irlich.de`
	const internalLinkRegex = /^(?:\/|https?:\/\/(?:[a-z0-9-]+\.)?tsg-irlich\.de(?:\/|$))/iu;

	if (internalLinkRegex.test(href)) {
		return <NextLink href={href}>{children}</NextLink>;
	}

	return (
		<a
			// oxlint-disable-next-line typescript/no-base-to-string
			aria-label={`${children?.toString() ?? 'Link'} (öffnet in neuem Tab)`}
			href={href}
			rel="noopener noreferrer"
			target="_blank"
		>
			{children}
		</a>
	);
};

type PortableTextValue = PortableTextPrimitiveProps['value'];

interface PortableTextProps {
	value: PortableTextValue;
}

const components: PortableTextComponents = {
	block: {
		blockquote: Blockquote,
		h2: H2WithAnchor,
		h3: H3WithAnchor,
	},
	list: {
		bullet: BulletList,
		number: NumberList,
	},
	listItem: {
		bullet: ListItem,
		number: ListItem,
	},
	marks: {
		externalLink: ExternalLink,
		internalLink: InternalLink,
		link: Link,
	},
};

function PortableText({ value }: Readonly<PortableTextProps>) {
	return <PortableTextPrimitive components={components} value={value} />;
}

export { PortableText, type PortableTextValue };
