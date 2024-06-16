import { defineField } from 'sanity';
import slug from 'slugify';

import { getMaxLengthRule, getMinLengthRule, getRequiredRole } from './validation-rules';

export function getHiddenSlugField(slug: string) {
	return defineField({
		title: 'Slug',
		name: 'slug',
		type: 'slug',
		group: 'general',
		readOnly: true,
		initialValue: { current: slug },
		hidden: true,
	});
}

export const introField = defineField({
	title: 'Intro',
	name: 'intro',
	type: 'text',
	group: 'general',
});

export const slugField = defineField({
	title: 'Slug',
	name: 'slug',
	type: 'slug',
	description: 'Ein Slug muss gesetzt werden, um die Seite anzeigen zu können.',
	group: 'general',
	options: {
		slugify: (input: string) => slug(input, { lower: true, trim: true }),
		source: 'title',
	},
	validation: rule => [getRequiredRole(rule, 'lug')],
});

export const subTitleField = defineField({
	title: 'Untertitel',
	name: 'subtitle',
	type: 'string',
	group: 'general',
	validation: rule => [
		getMinLengthRule(rule, 2, 'Untertitel'),
		getMaxLengthRule(rule, 30, 'Untertitel'),
	],
});

export const titleField = defineField({
	title: 'Titel',
	name: 'title',
	type: 'string',
	group: 'general',
	validation: rule => [getMinLengthRule(rule, 10, 'Titel'), getMaxLengthRule(rule, 65, 'Titel')],
});
