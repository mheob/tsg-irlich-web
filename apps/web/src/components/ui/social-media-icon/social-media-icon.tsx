import type { IconType } from '@icons-pack/react-simple-icons';
import type { ComponentPropsWithoutRef } from 'react';

import { ExternalLink } from '@/components/ui/external-link';
import { ContactLink } from '@/components/with-logic/contact-link';

/** The WhatsApp link opens a chat with the club's phone number, which stays guarded like any other. */
const PHONE_LINK_PREFIX = 'https://wa.me/';

interface SocialMediaIconProps {
	className?: ComponentPropsWithoutRef<IconType>['className'];
	href: string;
	icon: IconType;
	label: string;
}

/**
 * Links one social media profile of the club with its icon.
 *
 * A public profile (Facebook, Instagram, YouTube) is an ordinary external link, so search engines and
 * visitors without JavaScript can follow it (WEB-424). Only the WhatsApp link carries a phone number,
 * and like every phone number on the site it goes through `ContactLink`, which leaves it out of the
 * markup until someone uses it.
 *
 * @param props - The profile.
 * @param props.className - The classes of the icon.
 * @param props.href - The URL of the profile.
 * @param props.icon - The icon of the platform.
 * @param props.label - The accessible name of the link.
 * @returns The link.
 */
export function SocialMediaIcon({
	className = 'size-6 md:size-8 lg:size-12',
	href,
	icon: Icon,
	label,
}: Readonly<SocialMediaIconProps>) {
	if (href.startsWith(PHONE_LINK_PREFIX)) {
		return (
			<ContactLink
				aria-label={label}
				className="hover:text-secondary"
				href={href}
				rel="noopener noreferrer"
				target="_blank"
			>
				<Icon className={className} />
			</ContactLink>
		);
	}

	return (
		<ExternalLink aria-label={label} className="hover:text-secondary" href={href}>
			<Icon className={className} />
		</ExternalLink>
	);
}
