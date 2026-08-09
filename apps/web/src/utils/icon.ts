import type { IconType } from '@icons-pack/react-simple-icons';

import { socialMediaMap } from '@/components/ui/social-media-icon';

type SocialMediaName = keyof typeof socialMediaMap;

interface SocialMediaEntry {
	icon: IconType;
	name: SocialMediaName;
	url: string;
}

/**
 * Checks whether a key of a Sanity social media object maps to a known platform.
 *
 * Sanity objects also carry meta keys such as `_type`, which have no icon.
 *
 * @param name - The key to check
 * @returns `true` if an icon exists for the given key
 */
function isSocialMediaName(name: string): name is SocialMediaName {
	return name in socialMediaMap;
}

/**
 * Turns a Sanity social media object into renderable entries.
 *
 * Meta keys (for example `_type`) and platforms without a URL are skipped, so an
 * unknown or empty field never breaks rendering.
 *
 * @param socialMedia - The `socialFields` object from Sanity, may be null or undefined
 * @returns One entry per configured platform, each with its icon and URL
 */
export function getSocialMediaEntries(
	socialMedia: null | Record<string, string | undefined> | undefined,
): SocialMediaEntry[] {
	if (!socialMedia) {
		return [];
	}

	return Object.entries(socialMedia).flatMap(([name, url]) =>
		isSocialMediaName(name) && url ? [{ icon: socialMediaMap[name], name, url }] : [],
	);
}
