import type { IconType } from '@icons-pack/react-simple-icons';
import { SiFacebook, SiInstagram, SiWhatsapp, SiYoutube } from '@icons-pack/react-simple-icons';
import Link from 'next/link';
import type { ComponentPropsWithRef } from 'react';

interface SocialMediaIcons {
	facebook: IconType;
	instagram: IconType;
	whatsapp: IconType;
	youtube: IconType;
}

export const socialMediaMap: SocialMediaIcons = {
	facebook: SiFacebook,
	instagram: SiInstagram,
	whatsapp: SiWhatsapp,
	youtube: SiYoutube,
};

interface SocialMediaIconProps extends ComponentPropsWithRef<typeof Link> {
	icon: IconType;
	label: string;
}

export default function SocialMediaIcon({
	href,
	icon: Icon,
	label,
	ref,
	...props
}: Readonly<SocialMediaIconProps>) {
	if (label === '_type') return null;

	return (
		<Link
			aria-label={label}
			className="hover:text-secondary"
			href={href}
			ref={ref}
			rel="noopener noreferrer"
			target="_blank"
			{...props}
		>
			<Icon size="32" />
		</Link>
	);
}
