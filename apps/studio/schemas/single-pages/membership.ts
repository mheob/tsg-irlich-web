// cSpell:words mitgliedschaft
import { RiBookletLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { contactPersonsField } from '@/shared/fields/contact';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';

const membershipPage = defineType({
	title: 'Mitgliedschaft',
	name: 'membership',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
		// (hidden)
		getHiddenSlugField('mitgliedschaft'),

		// general
		...defaultHeroFields,

		// meta
		metaField,

		// content
		// TODO: add field for document downloads
		defineField({
			name: 'documents',
			title: 'Dokumente',
			type: 'array',
			of: [{ type: 'documentDownload' }],
			group: 'content',
			validation: Rule => [Rule.required().error('Dokumente sind erforderlich')],
		}),

		contactPersonsField,
	],
	preview: {
		prepare: () => ({ title: 'Mitgliedschaft' }),
	},
});

export default membershipPage;
