import { defineField } from 'sanity';
import slug from 'slugify';

import { maxLengthRule, minLengthRule, requiredRule } from '../validation-rules';

export function getHiddenSlugField(slug: string) {
	return defineField({
		title: 'Slug',
		name: 'slug',
		type: 'slug',
		group: 'general',
		readOnly: true,
		initialValue: { current: slug },
		// FIXME: hide the slug field after the initial development phase is over
		hidden: false,
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
	validation: rule => [requiredRule(rule, 'Die Slug')],
});

export const subTitleField = defineField({
	title: 'Untertitel',
	name: 'subtitle',
	type: 'string',
	group: 'general',
	validation: rule => [
		minLengthRule(rule, 3, 'Der Untertitel'),
		maxLengthRule(rule, 50, 'Der Untertitel'),
	],
});

export const titleField = defineField({
	title: 'Titel',
	name: 'title',
	type: 'string',
	group: 'general',
	validation: rule => [minLengthRule(rule, 3, 'Der Titel'), maxLengthRule(rule, 65, 'Der Titel')],
});

export const defaultPageFields = [titleField, subTitleField, introField];

export function getDefaultPageFieldsWithGroup(group?: string) {
	return defaultPageFields.map(field => ({ ...field, group }));
}
