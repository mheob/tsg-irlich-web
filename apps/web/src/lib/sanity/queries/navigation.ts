import groq from 'groq';
import { sanityClient } from 'sanity:client';

interface NavigationItem {
	href: string;
	label: string;
}

export async function getMainNavigation() {
	const result = await sanityClient.fetch<{ mainNavigation: NavigationItem[] }>(
		groq`
			*[_type == "site-settings"][0] {
				mainNavigation[] {
					"href": link->slug.current,
					"label": title,
				}
			}
		`,
	);

	return result.mainNavigation;
}

export async function getLegalNavigation(): Promise<NavigationItem[]> {
	const result = await sanityClient.fetch<{ legalNavigation: NavigationItem[] }>(
		groq`
			*[_type == "site-settings"][0] {
				legalNavigation[] {
					"href": link->slug.current,
					"label": title,
				}
			}
		`,
	);

	return result.legalNavigation;
}

interface SocialMedia {
	socialFields: {
		facebook: string;
		instagram: string;
		whatsapp: string;
		youtube: string;
	};
}

export async function getSocialMedia() {
	return await sanityClient.fetch<SocialMedia>(
		groq`
			*[_type == "site-settings"][0] {
				socialFields {
					facebook,
					instagram,
					whatsapp,
					youtube,
				}
			}
		`,
	);
}
