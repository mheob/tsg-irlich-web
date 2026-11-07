import { cache } from 'react';

import { client } from '@/lib/sanity/client';
import { organizationQuery } from '@/lib/sanity/queries/shared/organization';
import type { OrganizationQueryResult } from '@/types/sanity.types';

/**
 * How long the root layout's reads from the site settings are cached, in seconds: the menu, the
 * club's contact details and the placeholder of the search panel. The revalidation webhook expires
 * them earlier through their tags.
 */
// oxlint-disable-next-line no-magic-numbers
const SITE_SETTINGS_REVALIDATE_SECONDS = 60 * 60 * 12;

/** The revalidation webhook tags its run with the document type; the site settings are this one. */
const SITE_SETTINGS_TAG = 'site-settings';

/**
 * Reads the club's contact details and social profiles from the site settings.
 *
 * The footer shows them and the root layout's structured data describes the club with them, so both
 * read them here, with the same cache options: the page asks Sanity once, and the data stays cached
 * between two renders of a static page as well as on every render of a dynamic one.
 *
 * @returns The contact details and social profiles, or `null` without site settings.
 */
const getOrganization = cache(async (): Promise<OrganizationQueryResult> =>
	client.fetch<OrganizationQueryResult>(
		organizationQuery,
		{},
		{ next: { revalidate: SITE_SETTINGS_REVALIDATE_SECONDS, tags: [SITE_SETTINGS_TAG] } },
	),
);

export { getOrganization, SITE_SETTINGS_REVALIDATE_SECONDS, SITE_SETTINGS_TAG };
