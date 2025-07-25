import { defineField } from 'sanity';

import { slugify } from '@/utils/strings';

// eslint-disable-next-line ts/explicit-function-return-type
export function getHiddenSlugField(slug: string) {
	return defineField({
		title: 'Slug',
		name: 'slug',
		type: 'slug',
		group: 'general',
		readOnly: true,
		initialValue: { current: slug },
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
		slugify,
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

export const defaultHeroFields = [titleField, subTitleField];

export const defaultPageSectionFields = [titleField, subTitleField, introField];

export function getDefaultPageSectionFieldsWithGroup(
	group?: string,
): ReturnType<typeof defineField>[] {
	return defaultPageSectionFields.map(field => ({ ...field, group }));
}
