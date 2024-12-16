import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

export const newsOverviewHeroQuery = defineQuery(`*[_type == 'newsOverview'][0]`);

/** IMPORTANT: The param `department` is required for the contactPersons fragment. */
export const newsOverviewContactPersonsQuery = defineQuery(`
	*[_type == 'newsOverview'][0].content.contactPersonsSection.contactPersons[]-> {
		${contactPersons}
	}
`);
