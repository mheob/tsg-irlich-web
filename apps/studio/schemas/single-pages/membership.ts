// cSpell:words mitgliedschaft
import { RiBookletLine } from 'react-icons/ri';
import { defineType } from 'sanity';

import { contactPersonsField } from '@/shared/content-fields';
import { content, general, meta } from '@/shared/field-groups';
import { defaultPageFields, getHiddenSlugField } from '@/shared/general-fields';
import { metaField } from '@/shared/meta-fields';

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
