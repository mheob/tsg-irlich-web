import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

export const contactPageQuery = defineQuery(`
	*[_type == 'contact'][0] {
		...,
		content {
			...,
			contactPersonsSection {
				intro,
				subtitle,
				title,
			}
		}
	}
`);

export const contactPageContactPersonsQuery = defineQuery(`
	*[_type == 'contact'][0].content.contactPersonsSection.contactPersons[]-> {
		${contactPersons}
	}
`);
