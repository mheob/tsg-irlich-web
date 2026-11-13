import {
	Award,
	Building2,
	Dumbbell,
	Fence,
	Flag,
	Gift,
	Globe,
	GraduationCap,
	Handshake,
	Heart,
	HeartHandshake,
	Lightbulb,
	MapPin,
	Megaphone,
	PartyPopper,
	Shirt,
	Star,
	TrendingUp,
	Trophy,
	Users,
} from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import type { ReactElement } from 'react';

import type { PageIconName } from '@tsgi-web/shared/page-icons';

// A value of the shared list without a component here fails the type check.
const ICONS: Record<PageIconName, LucideIcon> = {
	award: Award,
	'building-2': Building2,
	dumbbell: Dumbbell,
	fence: Fence,
	flag: Flag,
	gift: Gift,
	globe: Globe,
	'graduation-cap': GraduationCap,
	handshake: Handshake,
	heart: Heart,
	'heart-handshake': HeartHandshake,
	lightbulb: Lightbulb,
	'map-pin': MapPin,
	megaphone: Megaphone,
	'party-popper': PartyPopper,
	shirt: Shirt,
	star: Star,
	'trending-up': TrendingUp,
	trophy: Trophy,
	users: Users,
};

function isPageIconName(value: string): value is PageIconName {
	return Object.hasOwn(ICONS, value);
}

// Draws the Lucide icon an editor chose for a page card; an unknown or missing value draws nothing.
function PageIcon({ icon, ...props }: Readonly<PageIconProps>): ReactElement | null {
	if (!icon || !isPageIconName(icon)) {
		return null;
	}

	const Icon = ICONS[icon];

	return <Icon {...props} />;
}

type PageIconProps = LucideProps & { icon?: null | string };

export { PageIcon };
