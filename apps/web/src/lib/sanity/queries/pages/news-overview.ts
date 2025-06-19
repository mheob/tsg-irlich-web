import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

export const newsOverviewPageQuery = defineQuery(`
	*[_type == 'newsOverview'][0] {
		...,
		content {
			contactPersonsSection {
				intro,
				subtitle,
				title,
			}
		}
	}
`);

export const newsOverviewContactPersonsQuery = defineQuery(`
	*[_type == 'newsOverview'][0].content.contactPersonsSection.contactPersons[]-> {
		${contactPersons}
	}
`);
