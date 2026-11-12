import {
	Fence,
	Gift,
	Globe,
	Handshake,
	Heart,
	HeartHandshake,
	MapPin,
	Megaphone,
	Shirt,
	Star,
	TrendingUp,
	Trophy,
	Users,
} from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import type { ReactElement } from 'react';

import type { PartnerIconName } from '@tsgi-web/shared/partner-icons';

const ICONS: Record<PartnerIconName, LucideIcon> = {
	fence: Fence,
	gift: Gift,
	globe: Globe,
	handshake: Handshake,
	heart: Heart,
	'heart-handshake': HeartHandshake,
	'map-pin': MapPin,
	megaphone: Megaphone,
	shirt: Shirt,
	star: Star,
	'trending-up': TrendingUp,
	trophy: Trophy,
	users: Users,
};

function isPartnerIconName(value: string): value is PartnerIconName {
	return Object.hasOwn(ICONS, value);
}

// Draws the Lucide icon of a partner page card; an unknown or missing value draws nothing.
function PartnerIcon({ icon, ...props }: Readonly<PartnerIconProps>): ReactElement | null {
	if (!icon || !isPartnerIconName(icon)) {
		return null;
	}

	const Icon = ICONS[icon];

	return <Icon {...props} />;
}

type PartnerIconProps = LucideProps & { icon?: null | string };

export { PartnerIcon };
