import { Box, Card, Flex } from '@sanity/ui';
import type { IconType } from 'react-icons';
import {
	LuAward,
	LuBuilding2,
	LuDumbbell,
	LuFence,
	LuFlag,
	LuGift,
	LuGlobe,
	LuGraduationCap,
	LuHandshake,
	LuHeart,
	LuHeartHandshake,
	LuLightbulb,
	LuMapPin,
	LuMegaphone,
	LuPartyPopper,
	LuShirt,
	LuStar,
	LuTrendingUp,
	LuTrophy,
	LuUsers,
} from 'react-icons/lu';
import type { StringInputProps } from 'sanity';

import type { PageIconName } from '@tsgi-web/shared/page-icons';

/** The size of the preview, a little larger than the text of the select. */
const PREVIEW_SIZE = 24;

// The same Lucide icons the website draws, through react-icons. A value of the shared list without
// an entry here fails the type check.
const PAGE_ICON_COMPONENTS: Record<PageIconName, IconType> = {
	award: LuAward,
	'building-2': LuBuilding2,
	dumbbell: LuDumbbell,
	fence: LuFence,
	flag: LuFlag,
	gift: LuGift,
	globe: LuGlobe,
	'graduation-cap': LuGraduationCap,
	handshake: LuHandshake,
	heart: LuHeart,
	'heart-handshake': LuHeartHandshake,
	lightbulb: LuLightbulb,
	'map-pin': LuMapPin,
	megaphone: LuMegaphone,
	'party-popper': LuPartyPopper,
	shirt: LuShirt,
	star: LuStar,
	'trending-up': LuTrendingUp,
	trophy: LuTrophy,
	users: LuUsers,
};

function isPageIconName(value: string): value is PageIconName {
	return Object.hasOwn(PAGE_ICON_COMPONENTS, value);
}

/**
 * The icon a value of `PAGE_ICONS` stands for, as the website shows it.
 *
 * @param props - The stored value.
 * @param props.icon - The icon value, such as `graduation-cap`.
 * @returns The icon, or nothing for a missing or unknown value.
 */
function PageIconPreview({ icon }: Readonly<{ icon?: string }>) {
	if (!icon || !isPageIconName(icon)) {
		return null;
	}

	const Icon = PAGE_ICON_COMPONENTS[icon];

	return <Icon aria-hidden="true" size={PREVIEW_SIZE} strokeWidth={1.5} />;
}

/**
 * The input of a card icon (partner and volunteer page): the studio's own select with a preview of
 * the chosen icon next to it, so the editors see what a name like „Gebäude“ looks like.
 *
 * @param props - The props the studio hands a string input.
 * @returns The select and the preview.
 */
function PageIconInput(props: StringInputProps) {
	return (
		<Flex align="center" gap={2}>
			<Card
				border
				padding={2}
				radius={2}
				style={{ boxSizing: 'content-box', height: PREVIEW_SIZE, width: PREVIEW_SIZE }}
			>
				<PageIconPreview icon={props.value} />
			</Card>
			<Box flex={1}>{props.renderDefault(props)}</Box>
		</Flex>
	);
}

export { PageIconInput, PageIconPreview };
