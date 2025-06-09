import type { IconType } from '@icons-pack/react-simple-icons';
import Link from 'next/link';
import type { ComponentPropsWithoutRef, ComponentPropsWithRef } from 'react';

interface SocialMediaIconProps extends ComponentPropsWithRef<typeof Link> {
	className?: ComponentPropsWithoutRef<IconType>['className'];
	icon: IconType;
	label: string;
}

export function SocialMediaIcon({
	className = 'size-6 md:size-8',
	icon: Icon,
	label,
	...props
}: Readonly<SocialMediaIconProps>) {
	if (label === '_type') return null;

	return (
		<Link
			aria-label={label}
			className="hover:text-secondary"
			rel="noopener noreferrer"
			target="_blank"
			{...props}
		>
			<Icon className={className} />
		</Link>
	);
}
