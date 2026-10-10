import { RiBookOpenLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { general, meta } from '@/shared/field-groups';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { getSinglePagePreview } from '@/shared/previews';

const echoOverviewPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('echo'),

		// General
		...defaultHeroFields,
		defineField({
			description: 'Der einleitende Text über dem Archiv aller Ausgaben.',
			group: 'general',
			name: 'intro',
			title: 'Intro',
			type: 'simpleBlockContent',
		}),

		// Meta
		metaField,
	],
	groups: [general, meta],
	icon: RiBookOpenLine,
	name: 'echoOverview',
	preview: getSinglePagePreview('TSG-Echo Übersicht'),
	title: 'TSG-Echo Übersicht',
	type: 'document',
});

export default echoOverviewPage;
