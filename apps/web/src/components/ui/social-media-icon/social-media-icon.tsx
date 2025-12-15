import type { IconType } from '@icons-pack/react-simple-icons';
import type { ComponentPropsWithoutRef, ComponentPropsWithRef } from 'react';

import { ContactLink } from '@/components/with-logic/contact-link';

interface SocialMediaIconProps extends ComponentPropsWithRef<typeof ContactLink> {
	className?: ComponentPropsWithoutRef<IconType>['className'];
	icon: IconType;
	label: string;
}

export function SocialMediaIcon({
	className = 'size-6 md:size-8 lg:size-12',
	icon: Icon,
	label,
	...props
}: Readonly<SocialMediaIconProps>) {
	if (label === '_type') return null;

	return (
		<ContactLink
			aria-label={label}
			className="hover:text-secondary"
			rel="noopener noreferrer"
			target="_blank"
			{...props}
		>
			<Icon className={className} />
		</ContactLink>
	);
}
