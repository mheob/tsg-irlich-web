import { defineField } from 'sanity';
import slug from 'slugify';

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
	validation: Rule => [Rule.required().error('Die Slug ist erforderlich')],
});

export const subTitleField = defineField({
	title: 'Untertitel',
	name: 'subtitle',
	type: 'string',
	group: 'general',
	validation: Rule => [
		Rule.required().min(3).error('Der Untertitel muss mindestens 3 Zeichen lang sein'),
		Rule.max(50).warning('Der Untertitel sollte nicht länger als 50 Zeichen sein'),
	],
});

export const titleField = defineField({
	title: 'Titel',
	name: 'title',
	type: 'string',
	group: 'general',
	validation: Rule => [
		Rule.required().min(3).error('Der Titel muss mindestens 3 Zeichen lang sein'),
		Rule.max(65).warning('Der Titel sollte nicht länger als 65 Zeichen sein'),
	],
});

export const defaultPageFields = [titleField, subTitleField, introField];

export function getDefaultPageFieldsWithGroup(group?: string) {
	return defaultPageFields.map(field => ({ ...field, group }));
}
