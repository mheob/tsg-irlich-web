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
	PortableText,
	type PortableTextBlock,
	type PortableTextComponent,
	type PortableTextComponents,
} from 'next-sanity';

const headingAnchor: PortableTextComponent<PortableTextBlock> = ({ children, value }) => (
	<h2 className="group relative" id={value?._key}>
		{children}
		<a
			className="absolute bottom-0 start-0 top-0 -ml-6 flex items-center opacity-0 transition-opacity group-hover:opacity-100"
			href={`#${value?._key}`}
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
	</h2>
);

interface PortableTextProps {
	className?: string;
	value: PortableTextBlock[];
}

export default function CustomPortableText({ value }: Readonly<PortableTextProps>) {
	const components: PortableTextComponents = {
		block: {
			h2: headingAnchor,
			h3: headingAnchor,
		},
	};

	return <PortableText components={components} value={value} />;
}
