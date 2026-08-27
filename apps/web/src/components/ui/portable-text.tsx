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
import type { ReactNode } from 'react';
import { isValidElement } from 'react';

import { getInternalHref } from '@/utils/links';

/**
 * Collects the plain text of a rendered React tree.
 *
 * A mark's `children` are only a string when the marked span carries no other mark. As soon as the
 * text is split — `Skigebiet <strong>Gitschberg-Jochtal</strong>.` — they are an array holding
 * strings and elements, and `toString()` on those yields `[object Object]`. Walking the tree keeps
 * the whole text, which is what the link's accessible name needs.
 *
 * @param node - The React node to read the text of.
 * @returns The concatenated text of the node and everything below it.
 */
function getTextContent(node: ReactNode): string {
	if (typeof node === 'string' || typeof node === 'number') {
		return String(node);
	}

	if (Array.isArray(node)) {
		return node.map((child: ReactNode) => getTextContent(child)).join('');
	}

	if (isValidElement<{ children?: ReactNode }>(node)) {
		return getTextContent(node.props.children);
	}

	return '';
}

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
		aria-label={`${getTextContent(children) || 'Link'} (öffnet in neuem Tab)`}
		// oxlint-disable-next-line typescript/no-unsafe-member-access typescript/no-unsafe-assignment
		href={value?.href}
		rel="noopener noreferrer"
		target="_blank"
	>
		{children}
	</a>
);

// oxlint-disable-next-line typescript/promise-function-async
const InternalLink: PortableTextMarkComponent = ({ children, value }) => {
	// The `target` is added to the mark by the `markDefsWithLinks` GROQ fragment.
	// oxlint-disable-next-line typescript/no-unsafe-argument typescript/no-unsafe-member-access
	const href = getInternalHref(value?.target);

	if (!href) {
		// `NODE_ENV` is set by Next.js itself and therefore not part of the validated env schema.
		// oxlint-disable-next-line node/no-process-env
		if (process.env.NODE_ENV === 'development') {
			console.warn('Internal link without a resolvable target:', value);
		}
		return children;
	}

	return <NextLink href={href}>{children}</NextLink>;
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
			aria-label={`${getTextContent(children) || 'Link'} (öffnet in neuem Tab)`}
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
