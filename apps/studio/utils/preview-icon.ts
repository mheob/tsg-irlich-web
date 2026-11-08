import { createElement, type ReactElement } from 'react';
import type { IconType } from 'react-icons';
import {
	RiCalendarEventLine,
	RiCommunityLine,
	RiHandHeartLine,
	RiHistoryLine,
	RiMegaphoneLine,
} from 'react-icons/ri';

import { DOSBIcon, isDosbIconName } from '@tsgi-web/shared';

/**
 * The club icons, for news that no sport pictogram fits, such as the news of the whole club or of
 * the press team. The name is the value the icon field stores.
 */
const CLUB_ICON_NAMES = [
	'Gesamtverein',
	'Historie',
	'Presse',
	'Soziales',
	'Veranstaltungen',
] as const;
type ClubIconName = (typeof CLUB_ICON_NAMES)[number];

const CLUB_ICONS: Readonly<Record<ClubIconName, IconType>> = {
	Gesamtverein: RiCommunityLine,
	Historie: RiHistoryLine,
	Presse: RiMegaphoneLine,
	Soziales: RiHandHeartLine,
	Veranstaltungen: RiCalendarEventLine,
};

const CLUB_ICON_NAMES_SET: ReadonlySet<string> = new Set<string>(CLUB_ICON_NAMES);

/**
 * Checks whether a stored icon name is one of the club icons.
 *
 * @param icon - The stored icon name.
 * @returns `true` if a club icon exists for the name.
 */
function isClubIconName(icon: string): icon is ClubIconName {
	return CLUB_ICON_NAMES_SET.has(icon);
}

/**
 * Returns the media of a document preview for a stored icon name: a DOSB pictogram or a club icon.
 * Both are one em in size like the Remix icons of the studio, so a list mixes them without jumping.
 * An unknown or missing name returns nothing, and the studio falls back to the icon of the type.
 *
 * Written with `createElement`, so the file holds no JSX and fast refresh has nothing to object to.
 *
 * @param icon - The stored icon name.
 * @returns The icon to show, or `undefined` when there is none.
 */
function getPreviewIcon(icon?: string): ReactElement | undefined {
	if (!icon) {
		return undefined;
	}
	// `DOSBIcon` sizes itself with Tailwind classes, which the studio does not have.
	if (isDosbIconName(icon)) {
		return createElement(DOSBIcon, { height: '1em', icon, width: '1em' });
	}
	if (isClubIconName(icon)) {
		return createElement(CLUB_ICONS[icon]);
	}
	return undefined;
}

export { CLUB_ICON_NAMES, getPreviewIcon };
export type { ClubIconName };
