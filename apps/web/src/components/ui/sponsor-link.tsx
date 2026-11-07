import type { ReactElement } from 'react';

import { ExternalLink } from './external-link';

interface SponsorLinkProps {
	/** The logo, a single element. */
	children: ReactElement;
	/** The sponsor's website from Sanity, where it is a required field. */
	website?: null | string;
}

/**
 * Links a sponsor's logo to its website (WEB-424). The link is marked `sponsored`, as search engines
 * ask for paid placements. A sponsor without a website keeps its logo without a link. The logo has to
 * be a block image: inside the inline link it would otherwise sit on a line box and gain the gap of
 * its descender below it.
 *
 * @param props - The logo and the website.
 * @param props.children - The logo.
 * @param props.website - The sponsor's website.
 * @returns The linked logo, or the logo alone.
 */
export function SponsorLink({ children, website }: Readonly<SponsorLinkProps>) {
	if (!website) {
		return children;
	}

	return (
		<ExternalLink href={website} rel="sponsored">
			{children}
		</ExternalLink>
	);
}
