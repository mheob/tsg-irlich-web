// cSpell:words mitgliedschaft
import { RiBookletLine } from 'react-icons/ri';
import { defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { contactPersonsField } from '@/shared/fields/contact';
import { defaultPageFields, getHiddenSlugField } from '@/shared/fields/general';
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
		...defaultPageFields,

		// meta
		metaField,

		// content
		contactPersonsField,
	],
	preview: {
		prepare: () => ({ title: 'Mitgliedschaft' }),
	},
});

export default membershipPage;
