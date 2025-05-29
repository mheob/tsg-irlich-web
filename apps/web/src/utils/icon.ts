import type { IconType } from '@icons-pack/react-simple-icons';

import { socialMediaMap } from '@/components/ui/social-media-icon';

/**
 * Gets the social media icon component for a given platform name
 *
 * @param name - The name of the social media platform (facebook, instagram, whatsapp, youtube)
 * @returns The icon component for the specified platform from the social media icon map
 */
export function getSocialMediaIcon(name: string): IconType {
	return socialMediaMap[name as keyof typeof socialMediaMap];
}
